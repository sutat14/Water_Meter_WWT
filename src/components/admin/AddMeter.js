import React, { useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import styles from './SharedMeterStyles.module.css'; // << เปลี่ยนมาใช้ CSS กลาง
import MeterFormUI from './MeterFormUI'; // << Import UI กลาง
import SuccessModal from './SuccessModal';

const initialRecordState = {
    meter_id: '', meter_name: '', type: '', factory: '',
    process: '', max_cap: '', max_meter: '', period: ''
};

const AddMeter = ({ onBack, token, apiBaseUrl }) => {
    const [record, setRecord] = useState(initialRecordState);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(''); // ใช้สำหรับ error หรือ success
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRecord(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const response = await fetch(`${apiBaseUrl}/add-meter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(record),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server returned an error');
            }
            setShowSuccessModal(true);
            setRecord(initialRecordState); // Reset form
        } catch (error) {
            setMessage(`ข้อผิดพลาด: ${error.message}`);
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
                <h1 className={styles.formTitle}>เพิ่มข้อมูลมิเตอร์ใหม่</h1>

                {loading && <p className={styles.loadingState}>กำลังบันทึก...</p>}
                {message && <p className={styles.errorMessage}>{message}</p>}

                <MeterFormUI
                    record={record}
                    onRecordChange={handleChange}
                    onSubmit={handleSubmit}
                    loading={loading}
                    mode="add"
                />
            </div>

            {showSuccessModal && (
                <SuccessModal message="เพิ่มข้อมูลมิเตอร์สำเร็จ!" onClose={() => setShowSuccessModal(false)} />
            )}
        </div>
    );
};

export default AddMeter;