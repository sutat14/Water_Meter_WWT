import React, { useState, useCallback } from 'react';
import { FaSearch, FaArrowLeft } from 'react-icons/fa';
import styles from './SharedMeterStyles.module.css'; // << เปลี่ยนมาใช้ CSS กลาง
import MeterFormUI from './MeterFormUI'; // << Import UI กลาง
import SuccessModal from './SuccessModal';

const WastewaterEdit = ({ onBack, token, apiBaseUrl }) => {
    const [meterId, setMeterId] = useState('');
    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const fetchRecord = useCallback(async () => {
        setLoading(true);
        setError('');
        setRecord(null);
        try {
            const response = await fetch(`${apiBaseUrl}/wastewater-info/${meterId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 404) { setError('ไม่พบข้อมูลสำหรับ Meter ID นี้'); return; }
            if (!response.ok) { throw new Error('Failed to fetch data.'); }
            const data = await response.json();
            setRecord(data);
        } catch (err) {
            setError('Failed to load data from server.');
        } finally {
            setLoading(false);
        }
    }, [meterId, token, apiBaseUrl]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRecord(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${apiBaseUrl}/wastewater-info/${meterId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(record)
            });
            if (!response.ok) { throw new Error('Failed to save data.'); }
            setShowSuccessModal(true);
            setRecord(null);
            setMeterId('');
        } catch (err) {
            setError('Failed to save data.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.cardContainer}>
                <button className={`${styles.actionButton} ${styles.backButton}`} onClick={onBack}>
                    <FaArrowLeft className={styles.icon} /> กลับ
                </button>
                <h1 className={styles.formTitle}>แก้ไขข้อมูลทั่วไป (Wastewater)</h1>

                <div className={styles.searchInputGroup}>
                    <input
                        className={styles.formInput}
                        type="text"
                        placeholder="กรอก Meter ID เพื่อค้นหา"
                        value={meterId}
                        onChange={(e) => setMeterId(e.target.value)}
                    />
                    <button className={`${styles.actionButton} ${styles.primaryButton}`} onClick={fetchRecord} disabled={loading}>
                        <FaSearch className={styles.icon} /> ค้นหา
                    </button>
                </div>

                {loading && <p className={styles.loadingState}>กำลังโหลด...</p>}
                {error && <p className={styles.errorMessage}>{error}</p>}

                {record && (
                    <MeterFormUI
                        record={record}
                        onRecordChange={handleChange}
                        onSubmit={handleSave}
                        loading={loading}
                        mode="edit"
                    />
                )}
            </div>
            
            {showSuccessModal && (
                <SuccessModal message="บันทึกข้อมูลสำเร็จ!" onClose={() => setShowSuccessModal(false)} />
            )}
        </div>
    );
};

export default WastewaterEdit;