import React, { useState } from 'react';
import { FaSearch, FaArrowLeft } from 'react-icons/fa';
import styles from './SharedMeterStyles.module.css'; // << เปลี่ยนมาใช้ CSS กลาง
import MeterFormUI from './MeterFormUI'; // << Import UI กลาง
import SuccessModal from './SuccessModal';

const DeleteMeter = ({ onBack, token, apiBaseUrl }) => {
    const [meterId, setMeterId] = useState('');
    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setRecord(null);
        try {
            const response = await fetch(`${apiBaseUrl}/wastewater-info/${meterId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 404) { setError('ไม่พบมิเตอร์ ID นี้'); return; }
            if (!response.ok) { throw new Error('Error fetching data'); }
            const data = await response.json();
            setRecord(data);
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการค้นหาข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e) => {
        e.preventDefault();
        if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบมิเตอร์ ID: ${meterId} ?`)) return;
        
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${apiBaseUrl}/delete-meter/${meterId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการลบข้อมูล');
            }
            setShowSuccessModal(true);
            setRecord(null);
            setMeterId('');
        } catch (err) {
            setError(err.message);
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
                <h1 className={styles.formTitle}>ลบข้อมูลมิเตอร์</h1>

                <form onSubmit={handleSearch} className={styles.searchInputGroup}>
                    <input
                        className={styles.formInput}
                        type="text"
                        placeholder="กรอก Meter ID เพื่อค้นหาและลบ"
                        value={meterId}
                        onChange={(e) => setMeterId(e.target.value)}
                    />
                    <button type="submit" className={`${styles.actionButton} ${styles.primaryButton}`} disabled={loading}>
                        <FaSearch className={styles.icon} /> ค้นหา
                    </button>
                </form>
                
                {loading && <p className={styles.loadingState}>กำลังดำเนินการ...</p>}
                {error && <p className={styles.errorMessage}>{error}</p>}
                
                {record && (
                    <>
                        <p style={{textAlign: 'center', marginBottom: '1rem'}}>กรุณาตรวจสอบข้อมูลก่อนยืนยันการลบ</p>
                        <MeterFormUI
                            record={record}
                            onRecordChange={() => {}} // ไม่ต้องทำอะไรเมื่อแก้ไข
                            onSubmit={handleDelete}
                            loading={loading}
                            mode="delete"
                        />
                    </>
                )}
            </div>

            {showSuccessModal && (
                <SuccessModal message="ลบข้อมูลมิเตอร์สำเร็จ!" onClose={() => setShowSuccessModal(false)} />
            )}
        </div>
    );
};

export default DeleteMeter;