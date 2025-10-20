// Import Libraries
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- Server Setup ---
const app = express();
const port = 5000;
const JWT_SECRET = 'your_super_secret_key'; // REMEMBER TO CHANGE THIS IN PRODUCTION!

// Middleware
app.use(cors());
app.use(express.json());

// --- Database Connection ---
const pool = new Pool({
    user: 'zabbix',
    host: '10.17.77.118',
    database: 'postgres',
    password: 'zabbix',
    port: 5433,
});

pool.connect()
    .then(client => {
        console.log('Successfully connected to PostgreSQL database! ✅');
        client.release();
    })
    .catch(err => {
        console.error('Error connecting to PostgreSQL:', err.stack);
    });

// --- JWT Authentication Middleware ---
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        return res.status(401).json({ error: 'Authentication token is missing.' });
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT verification error:', err);
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }
        req.user = user;
        next();
    });
};

// --- API Endpoints ---
app.get('/api/meters', async (req, res) => {
    try {
        const query = 'SELECT meter_id as "METER ID", meter_name as "METER NAME", max_cap as "MAX CAP" FROM public."wastewater_info" ORDER BY meter_id ASC';
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching all meters:', err);
        res.status(500).send('Server Error');
    }
});

// Endpoint สำหรับดึงข้อมูลมิเตอร์ทีละตัวด้วย ID
app.get('/api/wastewater-info/:meterId', async (req, res) => {
    try {
        const { meterId } = req.params; 
        const query = 'SELECT * FROM public."wastewater_info" WHERE meter_id = $1';
        
        const result = await pool.query(query, [meterId.toUpperCase()]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Meter ID not found.' });
        }
        
        res.status(200).json(result.rows[0]);

    } catch (err) {
        console.error('Error fetching single meter:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});


// Endpoint สำหรับอัปเดตข้อมูลมิเตอร์ด้วย ID
app.put('/api/wastewater-info/:meterId', verifyToken, async (req, res) => {
    try {
        const { meterId } = req.params;
        const {
            meter_name,
            type,
            factory,
            process,
            max_cap,
            max_meter,
            period
        } = req.body;

        const query = `
            UPDATE public."wastewater_info"
            SET 
                meter_name = $1,
                type = $2,
                factory = $3,
                process = $4,
                max_cap = $5,
                max_meter = $6,
                period = $7
            WHERE meter_id = $8;
        `;

        const result = await pool.query(query, [
            meter_name,
            type,
            factory,
            process,
            max_cap,
            max_meter,
            period,
            meterId.toUpperCase()
        ]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Meter ID not found for update.' });
        }

        res.status(200).json({ message: 'Wastewater info updated successfully.' });

    } catch (err) {
        console.error('Error updating wastewater info:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});


app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const query = 'SELECT user_id, name, password FROM public."user_info" WHERE name = $1';
        const result = await pool.query(query, [username]);
        const user = result.rows[0];
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ user_id: user.user_id, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        } else {
            res.status(401).json({ error: 'Invalid username or password.' });
        }
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.get('/api/water-meter-data-by-meter', verifyToken, async (req, res) => {
    try {
        const meterId = req.query.meterId;
        const days = parseInt(req.query.days) || 7;
        if (!meterId) {
            return res.status(400).json({ error: 'Meter ID is required.' });
        }
        const recordTableName = 'water_meter_record_wwt_a';
        const userTableName = 'user_info';
        const infoTableName = 'wastewater_info';
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        const infoQuery = `SELECT max_meter AS "MAX METER" FROM public."${infoTableName}" WHERE meter_id = $1;`;
        const infoResult = await pool.query(infoQuery, [meterId]);
        const maxMeter = infoResult.rows[0]?.["MAX METER"] || 1000000;
        const recordQuery = `
            SELECT
                r.meter_id AS "METER ID",
                r.log_datetime AS "DATE TIME",
                r.meter_value AS "Data METER",
                COALESCE(u.name, r.user_id) AS "Record ID"
            FROM public."${recordTableName}" AS r
            LEFT JOIN public."${userTableName}" AS u ON r.user_id = u.user_id
            WHERE r.meter_id = $1 AND r.log_datetime >= $2
            ORDER BY r.log_datetime DESC;
        `;
        const recordResult = await pool.query(recordQuery, [meterId, startDate.toISOString()]);
        if (recordResult.rows.length === 0) {
            return res.status(404).json({ error: 'No data found for this meter in the last 7 days.' });
        }
        const resultWithConsumption = recordResult.rows.map((row, index) => {
            const prevRow = recordResult.rows[index + 1];
            let consumption = "No data";
            if (prevRow) {
                const currentReading = parseFloat(row["Data METER"]);
                const previousReading = parseFloat(prevRow["Data METER"]);

                if (isNaN(currentReading) || isNaN(previousReading)) {
                    consumption = "Invalid Data";
                } else {
                    let diff = currentReading - previousReading;
                    if (diff < 0) { diff += maxMeter; }
                    consumption = Math.max(0, diff);
                }
            }
            return { ...row, "CONSUMPTION": consumption };
        });
        res.json(resultWithConsumption);
    } catch (err) {
        console.error('Error fetching meter data:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.put('/api/update-meter-data', verifyToken, async (req, res) => {
    try {
        const { meter_id, log_datetime, meter_value } = req.body;
        const recordDate = new Date(log_datetime);
        const query = `
            UPDATE public."water_meter_record_wwt_a"
            SET meter_value = $1, user_id = $2
            WHERE meter_id = $3 AND log_datetime = $4;
        `;
        const result = await pool.query(query, [meter_value, req.user.user_id, meter_id, recordDate]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'ไม่พบข้อมูลที่ตรงกัน โปรดตรวจสอบ Meter ID และ วัน/เวลา' });
        }
        res.status(200).json({ message: 'Data updated successfully.' });
    } catch (err) {
        console.error('Error updating data:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.get('/api/water-meter-data-by-factory/:factory_name', async (req, res) => {
    try {
        const factoryName = req.params.factory_name;
        const infoTableName = 'wastewater_info';
        const recordTableName = 'water_meter_record_wwt_a';
        const userTableName = 'user_info';

        const factoryMap = {
            a: 'FAC-A', b: 'FAC-B', c1: 'FAC-C1', c2: 'FAC-C2',
            d: 'FAC-D', a1: 'A1', other: 'OTHER'
        };
        const dbFactoryName = factoryMap[factoryName.toLowerCase()] || factoryName;

        const query = `
WITH RankedRecords AS (
    SELECT
        COALESCE(r.meter_id, i.meter_id) AS meter_id,
        r.log_datetime,
        r.meter_value::NUMERIC AS meter_value,
        LAG(r.meter_value::NUMERIC) OVER (PARTITION BY COALESCE(r.meter_id, i.meter_id) ORDER BY r.log_datetime) AS prev_meter_value,
        i.meter_name,
        i.process,
        i.max_cap::NUMERIC AS max_cap,
        i.max_meter,
        i.factory,
        u.name AS user_name
    FROM public."${recordTableName}" AS r
    RIGHT JOIN public."${infoTableName}" AS i ON r.meter_id = i.meter_id
    LEFT JOIN public."${userTableName}" AS u ON r.user_id = u.user_id
    WHERE i.factory = $1
)
SELECT
    meter_id AS "METER ID",
    meter_name AS "METER NAME",
    process AS "PROCESS",
    log_datetime AS "DATE TIME",
    meter_value AS "Data METER",
    user_name AS "Record ID",
    CASE
        WHEN prev_meter_value IS NULL OR meter_value IS NULL THEN NULL
        WHEN (meter_value - prev_meter_value) < 0
            THEN (meter_value + COALESCE(max_meter, 1000000) - prev_meter_value)
        ELSE (meter_value - prev_meter_value)
    END AS "CONSUMPTION",
    CASE
        WHEN prev_meter_value IS NULL OR meter_value IS NULL THEN 'No Data'
        WHEN (
            CASE
                WHEN (meter_value - prev_meter_value) < 0
                    THEN (meter_value + COALESCE(max_meter, 1000000) - prev_meter_value)
                ELSE (meter_value - prev_meter_value)
            END
        ) > max_cap THEN 'Exceeded'
        ELSE 'Normal'
    END AS "STATUS",
    max_cap AS "MAX CAP"
FROM RankedRecords
ORDER BY "METER ID" ASC;`;
        
        const result = await pool.query(query, [dbFactoryName]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching data by factory:', err);
        res.status(500).send('Server Error');
    }
});

app.get('/api/water-meter-data-by-meter-and-date/:meter_id', async (req, res) => {
    try {
        const { meter_id } = req.params;
        const { start, end } = req.query;
        if (!start || !end) {
            return res.status(400).json({ error: 'Start and end dates are required.' });
        }
        const adjustedStartDate = new Date(`${start} 00:00:00`);
        adjustedStartDate.setDate(adjustedStartDate.getDate() - 1);

        const query = `
            SELECT
                r.log_datetime AS "DATE TIME", r.meter_value AS "Data METER",
                COALESCE(u.name, r.user_id) AS "Record ID",
                i.meter_id AS "METER ID", i.meter_name AS "METER NAME",
                i.process AS "PROCESS", i.max_cap AS "MAX CAP", i.max_meter AS "MAX METER"
            FROM public."water_meter_record_wwt_a" AS r
            LEFT JOIN public."user_info" AS u ON r.user_id = u.user_id
            JOIN public."wastewater_info" AS i ON r.meter_id = i.meter_id
            WHERE r.meter_id = $1 AND r.log_datetime >= $2 AND r.log_datetime <= $3
            ORDER BY r.log_datetime ASC;
        `;
        const result = await pool.query(query, [meter_id, adjustedStartDate.toISOString(), `${end} 23:59:59`]);

        if (result.rows.length > 0) {
            const finalResultRows = result.rows.filter(row => new Date(row["DATE TIME"]) >= new Date(`${start} 00:00:00`));
            return res.json(finalResultRows);
        }

        const infoQuery = `
            SELECT meter_id AS "METER ID", meter_name AS "METER NAME", process AS "PROCESS",
                   max_cap AS "MAX CAP", max_meter AS "MAX METER"
            FROM public."wastewater_info" WHERE meter_id = $1;
        `;
        const infoResult = await pool.query(infoQuery, [meter_id]);
        if (infoResult.rows.length > 0) {
            const dataWithInfo = [{ ...infoResult.rows[0], "DATE TIME": null, "Data METER": null, "Record ID": null }];
            return res.json(dataWithInfo);
        }
        return res.json([]);
    } catch (err) {
        console.error('Error fetching meter data:', err);
        res.status(500).send('Server Error');
    }
});

app.get('/api/alarms/daily-no-data', async (req, res) => {
    try {
        let targetDate;

        // ตรวจสอบว่ามี date ส่งมาใน query string หรือไม่
        if (req.query.date && req.query.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // ถ้ามี และรูปแบบถูกต้อง (YYYY-MM-DD) ให้ใช้ค่านั้น
            targetDate = req.query.date;
        } else {
            // ถ้าไม่มี หรือรูปแบบผิด ให้สร้างวันที่ปัจจุบันของเซิร์ฟเวอร์ (Timezone ไทย)
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            targetDate = `${year}-${month}-${day}`;
        }

        const query = `
            WITH DailyMeters AS (
                SELECT meter_id, meter_name, factory, process
                FROM public."wastewater_info"
                WHERE "period" = 'D'
            ),
            DidLogOnTargetDate AS (
                SELECT DISTINCT r.meter_id
                FROM public."water_meter_record_wwt_a" r
                JOIN DailyMeters dm ON r.meter_id = dm.meter_id
                WHERE r.log_datetime::date = $1
            )
            SELECT
                dm.meter_id AS "METER ID",
                dm.meter_name AS "METER NAME",
                dm.factory AS "FACTORY",
                dm.process AS "PROCESS"
            FROM DailyMeters dm
            LEFT JOIN DidLogOnTargetDate dlt ON dm.meter_id = dlt.meter_id
            WHERE dlt.meter_id IS NULL
            ORDER BY dm.factory, dm.meter_id ASC;
        `;

        const result = await pool.query(query, [targetDate]);
        res.status(200).json(result.rows);

    } catch (err) {
        console.error('Error fetching daily no data alarm:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.get('/api/alarms/over-consumption', async (req, res) => {
    try {
        // รับค่าวันที่ ถ้าไม่มีให้ใช้ของวันนี้
        const targetDate = req.query.date || 'today';

        const query = `
            WITH RankedReadings AS (
                -- 1. หาข้อมูลทั้งหมดก่อนหรือในวันที่เลือก และจัดลำดับ (ล่าสุด = 1)
                SELECT
                    r.meter_id,
                    r.log_datetime,
                    r.meter_value::NUMERIC AS meter_value,
                    ROW_NUMBER() OVER (PARTITION BY r.meter_id ORDER BY r.log_datetime DESC) as rn
                FROM public."water_meter_record_wwt_a" r
                WHERE r.log_datetime::date <= $1
            ),
            PairedReadings AS (
                -- 2. จับคู่ข้อมูลล่าสุด (rn=1) และข้อมูลก่อนหน้า (rn=2) ของแต่ละมิเตอร์
                SELECT
                    meter_id,
                    MAX(CASE WHEN rn = 1 THEN meter_value END) AS current_reading,
                    MAX(CASE WHEN rn = 1 THEN log_datetime END) AS current_log_time,
                    MAX(CASE WHEN rn = 2 THEN meter_value END) AS previous_reading
                FROM RankedReadings
                WHERE rn IN (1, 2)
                GROUP BY meter_id
            )
            -- 3. คำนวณ consumption และ join กับข้อมูลมิเตอร์เพื่อกรอง
            SELECT
                i.meter_id AS "METER ID",
                i.meter_name AS "METER NAME",
                i.factory AS "FACTORY",
                i.max_cap::NUMERIC AS "MAX CAP",
                pr.current_reading AS "CURRENT READING",
                pr.previous_reading AS "PREVIOUS READING",
                CASE 
                    WHEN (pr.current_reading - pr.previous_reading) < 0 
                    THEN (pr.current_reading + COALESCE(i.max_meter, 1000000) - pr.previous_reading) 
                    ELSE (pr.current_reading - pr.previous_reading) 
                END AS "CONSUMPTION"
            FROM PairedReadings pr
            JOIN public."wastewater_info" i ON pr.meter_id = i.meter_id
            WHERE
                -- เงื่อนไข: ต้องมีข้อมูลครบทั้ง 2 ค่า
                pr.current_reading IS NOT NULL
                AND pr.previous_reading IS NOT NULL
                -- เงื่อนไข: ข้อมูลล่าสุดต้องเป็นของวันที่เลือกเท่านั้น
                AND pr.current_log_time::date = $1
                -- เงื่อนไข: Consumption ต้องมากกว่า Max Cap
                AND (CASE 
                        WHEN (pr.current_reading - pr.previous_reading) < 0 
                        THEN (pr.current_reading + COALESCE(i.max_meter, 1000000) - pr.previous_reading) 
                        ELSE (pr.current_reading - pr.previous_reading) 
                    END) > i.max_cap::NUMERIC
            ORDER BY i.factory, i.meter_id ASC;
        `;
        
        const result = await pool.query(query, [targetDate]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching over consumption alarm:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.get('/api/alarms/monthly-no-data', async (req, res) => {
    try {
        const query = `
            WITH LastLog AS (
                SELECT meter_id, MAX(log_datetime) as last_log_date
                FROM public."water_meter_record_wwt_a"
                GROUP BY meter_id
            )
            SELECT
                i.meter_id AS "METER ID",
                i.meter_name AS "METER NAME",
                i.factory AS "FACTORY",
                i.process AS "PROCESS",
                COALESCE(TO_CHAR(ll.last_log_date, 'YYYY-MM-DD HH24:MI:SS'), 'No Data Logged') AS "LAST LOG DATE"
            FROM public."wastewater_info" AS i
            LEFT JOIN LastLog ll ON i.meter_id = ll.meter_id
            WHERE
                i."period" = 'M'
                AND (ll.last_log_date IS NULL OR ll.last_log_date < NOW() - INTERVAL '30 days')
            ORDER BY
                i.factory, i.meter_id ASC;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching monthly no data alarm:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// --- Server Startup ---
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}🚀`);
});