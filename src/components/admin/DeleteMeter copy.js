import React, { useState } from 'react';
import styles from './DeleteMeter.module.css';

const DeleteMeter = ({ onBack, token, apiBaseUrl }) => {
    const [meterId, setMeterId] = useState('');
    const [foundMeter, setFoundMeter] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!meterId) {
            setError('กรุณาใส่รหัส Meter ID เพื่อค้นหา');
            return;
        }

        setIsSearching(true);
        setFoundMeter(null);
        setError('');
        setMessage('');

        try {
            const response = await fetch(`${apiBaseUrl}/wastewater-info/${meterId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.ok) {
                const data = await response.json();
                setFoundMeter(data);
                setMessage('พบข้อมูลมิเตอร์แล้ว');
            } else if (response.status === 404) {
                setError('ไม่พบมิเตอร์ ID นี้');
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'เกิดข้อผิดพลาดในการค้นหาข้อมูล');
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        } finally {
            setIsSearching(false);
        }
    };

    const handleDelete = async () => {
        const confirmDelete = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบมิเตอร์ ID: ${meterId} ?`);
        if (!confirmDelete) {
            return;
        }

        setIsDeleting(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch(`${apiBaseUrl}/delete-meter/${meterId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.ok) {
                setMessage('ลบข้อมูลมิเตอร์สำเร็จแล้ว');
                setMeterId('');
                setFoundMeter(null);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'เกิดข้อผิดพลาดในการลบข้อมูล');
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className={styles.deleteMeterContainer}>
            <div className={styles.deleteMeterCard}>
                <h2 className={styles.cardTitle}>ลบข้อมูลมิเตอร์</h2>
                <p className={styles.cardDescription}>โปรดระบุรหัส Meter ID ที่ต้องการลบ</p>
                <form onSubmit={handleSearch} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="meter-id">รหัส Meter ID</label>
                        <input
                            id="meter-id"
                            type="text"
                            value={meterId}
                            onChange={(e) => setMeterId(e.target.value)}
                            className={styles.formInput}
                            placeholder="ตัวอย่าง: RJW-M01"
                            required
                        />
                    </div>
                    {error && <p className={styles.errorMessage}>{error}</p>}
                    {message && <p className={styles.successMessage}>{message}</p>}
                    <div className={styles.buttonContainer}>
                        <button type="submit" className={styles.searchButton} disabled={isSearching}>
                            {isSearching ? '👀 กำลังค้นหา...' : '🔍 ค้นหาข้อมูล'}
                        </button>
                        <button type="button" className={styles.backButton} onClick={onBack}>
                            ↩️ กลับสู่หน้าหลัก
                        </button>
                    </div>
                </form>

                {foundMeter && (
                    <div className={styles.meterInfoContainer}>
                        <h3 className={styles.centerText}>ยืนยันการลบข้อมูล</h3>
                        <p className={styles.meterInfoItem}><strong>รหัส Meter ID:</strong> {foundMeter.meter_id}</p>
                        <p className={styles.meterInfoItem}><strong>ชื่อมิเตอร์:</strong> {foundMeter.meter_name}</p>
                        <p className={styles.meterInfoItem}><strong>ประเภท:</strong> {foundMeter.type}</p>
                        <p className={styles.meterInfoItem}><strong>โรงงาน:</strong> {foundMeter.factory}</p>
                        <p className={styles.meterInfoItem}><strong>กระบวนการ:</strong> {foundMeter.process}</p>
                        <p className={styles.meterInfoItem}><strong>ความจุสูงสุด (MAX CAP):</strong> {foundMeter.max_cap}</p>
                        <p className={styles.meterInfoItem}><strong>ค่าสูงสุดของมิเตอร์ (MAX METER):</strong> {foundMeter.max_meter}</p>
                        <p className={styles.meterInfoItem}><strong>ระยะเวลา (PERIOD):</strong> {foundMeter.period}</p>
                        <button onClick={handleDelete} className={styles.deleteButton} disabled={isDeleting}>
                            {isDeleting ? 'กำลังลบ...' : 'ยืนยันการลบข้อมูล'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeleteMeter;
