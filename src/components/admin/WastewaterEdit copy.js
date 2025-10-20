import React, { useState, useCallback } from 'react';
import { FaSearch, FaSave, FaArrowLeft } from 'react-icons/fa';
import styles from './WastewaterEdit.module.css'; // Import the CSS Module
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
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                if (response.status === 404) {
                    setError('ไม่พบข้อมูลสำหรับ Meter ID นี้');
                } else {
                    throw new Error('Failed to fetch data.');
                }
            }
            const data = await response.json();
            setRecord(data);
        } catch (err) {
            console.error('Error fetching wastewater info:', err);
            setError('Failed to load data from server.');
        } finally {
            setLoading(false);
        }
    }, [meterId, token, apiBaseUrl]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRecord(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
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
            if (!response.ok) {
                throw new Error('Failed to save data.');
            }
            
            setShowSuccessModal(true);
            setRecord(null);
            setMeterId('');
        } catch (err) {
            console.error('Error saving wastewater info:', err);
            setError('Failed to save data.');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowSuccessModal(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.cardContainer}>
                <button
                    className={`${styles.actionButton} ${styles.backButton}`}
                    onClick={onBack}
                >
                    <FaArrowLeft className={styles.icon} /> กลับไป Dashboard
                </button>
                <h1 className={styles.formTitle}>แก้ไขข้อมูลทั่วไป (Wastewater)</h1>

                <div className={styles.searchInputGroup}>
                    <input
                        className={`${styles.formInput} ${styles.searchInput}`}
                        type="text"
                        placeholder="กรอก Meter ID"
                        value={meterId}
                        onChange={(e) => setMeterId(e.target.value)}
                    />
                    <button
                        className={`${styles.actionButton} ${styles.primaryButton}`}
                        onClick={fetchRecord}
                        disabled={loading}
                    >
                        <FaSearch className={styles.icon} /> ค้นหา
                    </button>
                </div>

                {loading && <p className={styles.loadingState}>กำลังโหลดข้อมูล...</p>}
                {error && <p className={styles.errorMessage}>{error}</p>}

                {record && (
                    <div className={styles.recordForm}>
                        <div className={styles.dataEditFormGrid}>
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>meter_id</label>
                                <input type="text" name="meter_id" value={record.meter_id || ''} onChange={handleChange} disabled className={styles.formInput} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>meter_name</label>
                                <input type="text" name="meter_name" value={record.meter_name || ''} onChange={handleChange} className={styles.formInput} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>type</label>
                                <input type="text" name="type" value={record.type || ''} onChange={handleChange} className={styles.formInput} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>factory</label>
                                <input type="text" name="factory" value={record.factory || ''} onChange={handleChange} className={styles.formInput} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>process</label>
                                <input type="text" name="process" value={record.process || ''} onChange={handleChange} className={styles.formInput} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>max_cap</label>
                                <input type="number" name="max_cap" value={record.max_cap || ''} onChange={handleChange} className={styles.formInput} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>max_meter</label>
                                <input type="number" name="max_meter" value={record.max_meter || ''} onChange={handleChange} className={styles.formInput} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>period</label>
                                <input type="text" name="period" value={record.period || ''} onChange={handleChange} className={styles.formInput} />
                            </div>
                        </div>

                        <div className={styles.buttonContainer}>
                            <button
                                className={`${styles.actionButton} ${styles.saveButton} ${styles.primaryButton}`}
                                onClick={handleSave}
                                disabled={loading}
                            >
                                <FaSave className={styles.icon} /> บันทึกข้อมูล
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {showSuccessModal && (
                <SuccessModal
                    message="บันทึกข้อมูลสำเร็จ!"
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default WastewaterEdit;
