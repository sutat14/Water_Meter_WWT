import React, { useState } from 'react';
import styles from './AddMeter.module.css'; // นำเข้าไฟล์ CSS Modules

const AddMeter = ({ onBack, token, apiBaseUrl }) => {
    const [meterId, setMeterId] = useState('');
    const [meterName, setMeterName] = useState('');
    const [type, setType] = useState('');
    const [factory, setFactory] = useState('');
    const [process, setProcess] = useState('');
    const [maxCap, setMaxCap] = useState('');
    const [maxMeter, setMaxMeter] = useState('');
    const [period, setPeriod] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('กำลังเพิ่มข้อมูล...');
        try {
            const response = await fetch(`${apiBaseUrl}/add-meter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    meter_id: meterId,
                    meter_name: meterName,
                    type: type,
                    factory: factory,
                    process: process,
                    max_cap: parseFloat(maxCap),
                    max_meter: parseFloat(maxMeter),
                    period: period,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server returned an error');
            }

            setMessage('เพิ่มข้อมูลมิเตอร์สำเร็จ!');
            setMeterId('');
            setMeterName('');
            setType('');
            setFactory('');
            setProcess('');
            setMaxCap('');
            setMaxMeter('');
            setPeriod('');
        } catch (error) {
            setMessage(`ข้อผิดพลาด: ${error.message}`);
        }
    };

    return (
        <div className={styles.cardContainer}>
            <h1 className={styles.formTitle}>เพิ่มข้อมูลมิเตอร์ใหม่</h1>
            <form onSubmit={handleSubmit}>
                <div className={styles.formInputGroup}>
                    <input
                        type="text"
                        className={styles.formInput}
                        placeholder="🔢 รหัส METER ID"
                        value={meterId}
                        onChange={(e) => setMeterId(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        className={styles.formInput}
                        placeholder="🏷️ ชื่อ METER NAME"
                        value={meterName}
                        onChange={(e) => setMeterName(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        className={styles.formInput}
                        placeholder="💡 ประเภท (TYPE)"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        className={styles.formInput}
                        placeholder="🏭 โรงงาน (FACTORY)"
                        value={factory}
                        onChange={(e) => setFactory(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        className={styles.formInput}
                        placeholder="⚙️ กระบวนการ (PROCESS)"
                        value={process}
                        onChange={(e) => setProcess(e.target.value)}
                        required
                    />
                    <input
                        type="number"
                        className={styles.formInput}
                        placeholder="📈 ความจุสูงสุด (MAX CAP)"
                        value={maxCap}
                        onChange={(e) => setMaxCap(e.target.value)}
                        required
                    />
                    <input
                        type="number"
                        className={styles.formInput}
                        placeholder="📊 ค่าสูงสุดของมิเตอร์ (MAX METER)"
                        value={maxMeter}
                        onChange={(e) => setMaxMeter(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        className={styles.formInput}
                        placeholder="📅 ระยะเวลา (PERIOD)"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        required
                    />
                </div>

                <div className={styles.buttonContainer}>
                    <button type="submit" className={`${styles.actionButtonPrimary}`}>
                        <span role="img" aria-label="checkmark">✅</span> บันทึกข้อมูล
                    </button>
                    <button type="button" className={styles.secondaryButton} onClick={onBack}>
                        <span role="img" aria-label="home">↩️</span> กลับสู่หน้าหลัก
                    </button>
                </div>
            </form>
            {message && <p className={styles.errorMessage}>{message}</p>}
        </div>
    );
};

export default AddMeter;
