import React, { useState, useEffect, } from 'react';
import DashboardLayout from '../common/DashboardLayout';
import Clock from '../common/Clock';
import Chart from '../common/Chart';
import Table from '../common/Table';
import meterIcon from '../../assets/Icon_meter.png';
import styles from './OverviewDashboard.module.css';
import AlarmButton from '../common/AlarmButton';

// =================================================================
// 1. CONFIGURATION & CONSTANTS
// =================================================================

const apiBaseUrl = 'http://localhost:5000/api';
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const tableHeaders = ["METER ID", "METER NAME", "PROCESS", "DATE TIME", "Data METER", "CONSUMPTION (m³)", "STATUS", "Record ID", "MAX CAP (m³)"];

/**
 * กำหนด options สำหรับ Chart.js
 * @param {string} selectedFactory ชื่อโรงงานที่ถูกเลือก
 * @returns {object} Chart options object
 */
const getChartOptions = (selectedFactory) => ({
    responsive: true,
    plugins: {
        legend: { position: 'top' },
        title: {
            display: true,
            text: `ปริมาณการใช้น้ำ - Factory ${selectedFactory}`,
            font: { size: 15, weight: 'bold' },
            padding: { top: 20, bottom: 20 },
            color: '#333',
        },
    },
    maintainAspectRatio: false,
    animation: {
        duration: 0,  // ปิดแอนิเมชันทั้งหมดเพื่อป้องกันการกระตุก
    },
    scales: {
        x: {
            ticks: {
                maxRotation: 45,
                minRotation: 45,
                autoSkip: true,
            },
        },
        y: {
            beginAtZero: true,
            title: {
                display: true,
                text: 'ปริมาณการใช้น้ำ (m³)',
            },
            grid: {
                drawOnChartArea: true,
            },
            position: 'left',
            display: true,
        },
        y2: {
            beginAtZero: true,
            title: {
                display: true,
                text: 'Max Cap (m³)/Day',
            },
            position: 'right',
            display: true,
            grid: {
                drawOnChartArea: false,
            },
        },
    },
});

// ฟังก์ชันสำหรับคำนวณวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Debounce hook
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

// ฟังก์ชันสำหรับดึงข้อมูล Alarm จาก API
const fetchSingleAlarmCount = async (endpoint) => {
    try {
        const response = await fetch(`${apiBaseUrl}/alarms/${endpoint}`);
        if (!response.ok) {
            console.error(`API Error for ${endpoint}: ${response.status} ${response.statusText}`);
            return 0;
        }
        const data = await response.json();
        return data.length;
    } catch (e) {
        console.error(`Fetch Error for ${endpoint}:`, e);
        return 0;
    }
};

// ฟังก์ชันแปลงข้อมูล Array of Objects เป็นรูปแบบ CSV
const convertToCSV = (data) => {
    const headers = ["METER ID", "METER NAME", "PROCESS", "DATE TIME", "Data METER", "CONSUMPTION", "STATUS", "Record ID", "MAX CAP"];
    const csvRows = [headers.join(',')];
    data.forEach(item => {
        const values = headers.map(header => JSON.stringify(item[header] || ''));
        csvRows.push(values.join(','));
    });
    return csvRows.join('\n');
};

// =================================================================
// 3. OVERVIEW DASHBOARD COMPONENT
// =================================================================

const OverviewDashboard = ({
    factories,
    selectedFactory,
    setSelectedFactory,
    selectedDate: propSelectedDate,
    handleDailyDateChange: propHandleDailyDateChange,
    isFactoryLoading,
    factoryData,
    handleMeterClick,
    handleViewAlarm
}) => {
    const todayDate = getTodayDate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState(propSelectedDate || todayDate);
    const [alarmCounts, setAlarmCounts] = useState({
        dailyNoData: 0,
        overConsumption: 0,
        monthlyNoData: 0
    });
    const [isAlarmLoading, setIsAlarmLoading] = useState(true);

    const debouncedSearchQuery = useDebounce(searchQuery, 500); // เลื่อนการกรองข้อมูลไป 500ms

    const [filteredFactoryData, setFilteredFactoryData] = useState([]);

    useEffect(() => {
        const filteredData = factoryData.filter(item =>
            item["METER NAME"] && item["METER NAME"].toString().toLowerCase().startsWith(debouncedSearchQuery.toLowerCase())
        );
        setFilteredFactoryData(filteredData); // อัปเดต state ที่จะเก็บ filtered data
    }, [debouncedSearchQuery, factoryData]); // รีเฟรชเมื่อ `debouncedSearchQuery` หรือ `factoryData` เปลี่ยนแปลง

    useEffect(() => {
        const fetchAlarmCounts = async () => {
            setIsAlarmLoading(true);

            const [daily, over, monthly] = await Promise.all([
                fetchSingleAlarmCount('daily-no-data'),
                fetchSingleAlarmCount('over-consumption'),
                fetchSingleAlarmCount('monthly-no-data')
            ]);

            setAlarmCounts({
                dailyNoData: daily,
                overConsumption: over,
                monthlyNoData: monthly
            });
            setIsAlarmLoading(false);
        };

        fetchAlarmCounts();

        const intervalId = setInterval(fetchAlarmCounts, 300000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (propSelectedDate && propSelectedDate !== selectedDate) {
            setSelectedDate(propSelectedDate);
        }
    }, [propSelectedDate, selectedDate]);

    const handleDailyDateChange = (date) => {
        setSelectedDate(date);
        if (propHandleDailyDateChange) {
            propHandleDailyDateChange(date);
        }
    };

    const handleExport = () => {
        const csv = convertToCSV(filteredFactoryData); // ใช้ filteredFactoryData ที่กรองแล้ว
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `report_${selectedFactory}_${selectedDate || 'latest'}.csv`);
        link.click();
    };

    const tableDisplayData = filteredFactoryData.map(item => {
        let consumptionValue = 'No data';
        let statusValue = 'No data';
        const dataMeterDisplay = item["Data METER"] === 'No data' || item["Data METER"] === null || item["Data METER"] === undefined ? '❓' : item["Data METER"];
        const recordIdDisplay = item["Record ID"] || "🧑‍🔧";
        let dateTimeDisplay = '❓';

        if (item["DATE TIME"] && item["DATE TIME"] !== 'No data') {
            const dateObj = new Date(item["DATE TIME"]);
            const formattedDate = 
                String(dateObj.getDate()).padStart(2, '0') + ' ' +
                monthNames[dateObj.getMonth()] + ' ' +
                dateObj.getFullYear();

            const formattedTime = dateObj.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });

            dateTimeDisplay = `${formattedDate} 🕒 ${formattedTime}`;
        }

        if (item["DATE TIME"] !== 'No data' && item["Data METER"] !== 'No data' && item["Data METER"] !== null && item["Data METER"] !== undefined) {
            const consumption = parseFloat(item["CONSUMPTION"]);
            const maxCap = parseFloat(item["MAX CAP"]);

            consumptionValue = isNaN(consumption) ? '❓' : consumption;

            if (consumption > maxCap) {
                statusValue = 'Exceeded';
            } else {
                statusValue = 'Normal';
            }
        } else {
            consumptionValue = 'No data';
            statusValue = 'No data';
        }

        return {
            "METER ID": item["METER ID"],
            "METER NAME": item["METER NAME"],
            "PROCESS": item["PROCESS"],
            "DATE TIME": dateTimeDisplay,
            "Data METER": dataMeterDisplay,
            "CONSUMPTION": consumptionValue === 'No data' ? '❓' : consumptionValue,
            "STATUS": statusValue,
            "Record ID": recordIdDisplay,
            "MAX CAP": item["MAX CAP"]
        };
    });

    const consumptionData = filteredFactoryData.map(item => parseFloat(item["CONSUMPTION"]));
    const maxCapData = filteredFactoryData.map(item => parseFloat(item["MAX CAP"]));
    
    const barColors = consumptionData.map((consumption, index) => {
        const maxCap = maxCapData[index];
        if (consumption > maxCap) {
            return 'rgba(239, 68, 68, 0.8)'; // Red for exceeded
        }
        return 'rgba(53, 162, 235, 0.5)'; // Blue for normal
    });

    const chartData = {
        labels: filteredFactoryData.map(item => item["METER ID"]),
        datasets: [
            {
                label: 'ปริมาณการใช้น้ำ (m³)',
                data: consumptionData,
                backgroundColor: barColors,
                borderWidth: 1,
                yAxisID: 'y',
            },
            {
                label: 'ค่าสูงสุด (m³)',
                data: maxCapData,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                type: 'line',
                pointRadius: 3,
                borderWidth: 0.8,
                tension: 0.4,
                yAxisID: 'y2',
            },
        ],
    };

    // --- Sub-Components for Rendering ---

    const AlarmCounters = () => (
        <div className={styles.alarmCounters}>
            <AlarmButton 
                title="Total Meter daily no data" 
                count={alarmCounts.dailyNoData} 
                isLoading={isAlarmLoading}
                onClick={() => handleViewAlarm('daily-no-data')}
            />
            <AlarmButton 
                title="Total Meter daily over consumption" 
                count={alarmCounts.overConsumption} 
                isLoading={isAlarmLoading}
                onClick={() => handleViewAlarm('over-consumption')}
            />
            <AlarmButton 
                title="Total Meter monthly no data" 
                count={alarmCounts.monthlyNoData} 
                isLoading={isAlarmLoading}
                onClick={() => handleViewAlarm('monthly-no-data')}
            />
        </div>
    );

    const headerTitle = (
        <React.Fragment>
            <img src={meterIcon} alt="Meter Icon" className={styles.icon} />
            Water Consumption Dashboard
        </React.Fragment>
    );

    const headerControls = (
        <React.Fragment>
            <div className={styles.buttonGroup}>
                {factories.map(f => (
                    <button
                        key={f}
                        className={`${styles.factoryButton} ${selectedFactory === f ? styles.active : ''}`}
                        onClick={() => setSelectedFactory(f)}
                    >
                        {f === 'A1' || f === 'OTHER' ? f : `Factory ${f}`}
                    </button>
                ))}
            </div>
            <Clock />
        </React.Fragment>
    );

    const filterSection = (
        <React.Fragment>
            <div className={styles.filterLeft}>
                <div className={styles.datePickerContainer}>
                    <label htmlFor="daily-date" className={styles.inputLabel}>
                        <i>📅</i> เลือกวันที่:
                    </label>
                    <input
                        type="date"
                        id="daily-date"
                        value={selectedDate}
                        onChange={(e) => handleDailyDateChange(e.target.value)}
                        className={styles.dateInput}
                    />
                </div>
                <div className={styles.searchContainer}>
                    <label htmlFor="search-filter" className={styles.inputLabel}>
                        🔍 ค้นหา มิเตอร์:
                    </label>
                    <input
                        type="text"
                        id="search-filter"
                        placeholder="เช่น C, CT, etc."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <button className={styles.fetchButton} onClick={handleExport}>
                    <i className="fa fa-download" /> ส่งออกข้อมูล (CSV)
                </button>
            </div>
            <div className={styles.filterRight}>
                <AlarmCounters />
            </div>
        </React.Fragment>
    );

    const chartComponent = (
        <React.Fragment>
            <Chart 
                data={chartData} 
                options={getChartOptions(selectedFactory)} 
                chartType="bar" 
            />
        </React.Fragment>
    );

    const tableComponent = (
        <Table
            title={`รายงานปริมาณการใช้น้ำ - Factory ${selectedFactory}`}
            headers={tableHeaders}
            data={tableDisplayData}
            onRowClick={handleMeterClick}
        />
    );

    // --- Main Render ---

    return (
        <DashboardLayout
            title={headerTitle}
            headerControls={headerControls}
            filterSection={filterSection}
            chart={chartComponent}
            table={tableComponent}
            isChartLoading={isFactoryLoading}
            chartDataAvailable={chartData.labels.length > 0}
        />
    );
};

export default OverviewDashboard;
