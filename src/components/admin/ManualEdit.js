import React, { useState, useCallback } from 'react';
import styles from './ManualEdit.module.css'; // Import as a module

// Inline SVG Icons (can be moved to a separate file for larger projects)
const FaSearch = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.3-128-128S137.3 80 208 80s128 57.3 128 128-57.3 128-128 128z"></path>
    </svg>
);
const FaSave = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M433.941 129.941l-83.882-83.882A48 48 0 0 0 316.118 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V163.882a48 48 0 0 0-14.059-33.941zM224 416c-35.346 0-64-28.654-64-64s28.654-64 64-64 64 28.654 64 64-28.654 64-64 64zm96-304.529V208H128V111.471C128 96.221 140.221 84 155.471 84h137.058C307.779 84 320 96.221 320 111.471z"></path>
    </svg>
);
const FaArrowLeft = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M257.5 445.1l-180-180c-4.7-4.7-4.7-12.3 0-17l180-180c4.7-4.7 12.3-4.7 17 0l16 16c4.7 4.7 4.7 12.3 0 17l-137.1 137.1 137.1 137.1c4.7 4.7 4.7 12.3 0 17l-16 16c-4.7 4.7-12.3 4.7-17 0z"></path>
    </svg>
);
const FaTimes = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 352 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path>
    </svg>
);

// --- Hooks and State Management ---
const ManualEdit = ({ onBack, token }) => {
    const [meterId, setMeterId] = useState('');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [infoMessage, setInfoMessage] = useState('');
    const [isInfoError, setIsInfoError] = useState(false);

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`http://localhost:5000/api/water-meter-data-by-meter?meterId=${meterId}&days=7`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch data.');
            }
            const data = await response.json();
            const sortedData = data.sort((a, b) => new Date(b["DATE TIME"]) - new Date(a["DATE TIME"]));
            setRecords(sortedData);
        } catch (err) {
            setError('Failed to load meter data.');
            setRecords([]);
        } finally {
            setLoading(false);
        }
    }, [meterId, token]);

    const handleUpdate = (record) => {
        setCurrentRecord(record);
        setShowEditModal(true);
    };

    const handleSave = async (newValue) => {
        if (!currentRecord) return;
        setShowEditModal(false);

        try {
            const response = await fetch('http://localhost:5000/api/update-meter-data', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    meter_id: currentRecord["METER ID"],
                    log_datetime: currentRecord["DATE TIME"],
                    meter_value: parseFloat(newValue)
                }),
            });

            if (response.ok) {
                setInfoMessage('Data updated successfully!');
                setIsInfoError(false);
                setShowInfoModal(true);
                fetchRecords(); // Refresh data
            } else {
                const errorData = await response.json();
                setInfoMessage(`Update failed: ${errorData.error || 'Server error'}`);
                setIsInfoError(true);
                setShowInfoModal(true);
            }
        } catch (err) {
            setInfoMessage('Failed to connect to the server.');
            setIsInfoError(true);
            setShowInfoModal(true);
        } finally {
            setCurrentRecord(null);
        }
    };

    const handleCancel = () => {
        setShowEditModal(false);
        setCurrentRecord(null);
    };

    const handleCloseInfoModal = () => {
        setShowInfoModal(false);
        setInfoMessage('');
        setIsInfoError(false);
    };

    // --- JSX Rendering ---
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <button
                        className={`${styles.button} ${styles.backButton}`}
                        onClick={onBack}
                    >
                        <FaArrowLeft className={styles.icon} /> กลับไป Dashboard
                    </button>
                    <h1 className={styles.title}>แก้ไขข้อมูลมิเตอร์</h1>
                </div>
                <div className={styles.searchBar}>
                    <input
                        className={styles.input}
                        type="text"
                        placeholder="กรอก Meter ID"
                        value={meterId}
                        onChange={(e) => setMeterId(e.target.value)}
                    />
                    <button
                        className={`${styles.button} ${styles.searchButton}`}
                        onClick={fetchRecords}
                    >
                        <FaSearch className={styles.icon} /> ค้นหา
                    </button>
                </div>
                {loading && <p className={styles.loading}>กำลังโหลดข้อมูล...</p>}
                {error && <p className={styles.error}>{error}</p>}
                {!loading && records.length > 0 && (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.tableHeader}>METER ID</th>
                                    <th className={styles.tableHeader}>DATE TIME</th>
                                    <th className={styles.tableHeader}>DATA METER (เก่า)</th>
                                    <th className={styles.tableHeader}>บันทึกโดย</th>
                                    <th className={styles.tableHeader}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record, index) => (
                                    <tr key={index}>
                                        <td className={styles.tableCell}>{record["METER ID"]}</td>
                                        <td className={`${styles.tableCell} ${styles.dateTimeCell}`}>
                                            {new Date(record["DATE TIME"]).toLocaleDateString()} {new Date(record["DATE TIME"]).toLocaleTimeString()}
                                        </td>
                                        <td className={styles.tableCell}>{record["Data METER"]}</td>
                                        <td className={styles.tableCell}>{record["Record ID"]}</td>
                                        <td className={styles.tableCell}>
                                            <button
                                                className={`${styles.button} ${styles.editButton}`}
                                                onClick={() => handleUpdate(record)}
                                            >
                                                <FaSave className={styles.icon} /> แก้ไข
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {!loading && records.length === 0 && meterId && <p className={styles.noData}>ไม่พบข้อมูลสำหรับ Meter ID นี้ใน 7 วันที่ผ่านมา</p>}
            </div>
            {showEditModal && currentRecord && (
                <EditModal
                    record={currentRecord}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}
            {showInfoModal && (
                <InfoModal
                    message={infoMessage}
                    onClose={handleCloseInfoModal}
                    isError={isInfoError}
                />
            )}
        </div>
    );
};

// Modal Components
const EditModal = ({ record, onSave, onCancel }) => {
    const [newValue, setNewValue] = useState(record["Data METER"]);

    const handleSave = () => {
        if (typeof newValue === 'string' && newValue.trim() === '') {
            onCancel();
            return;
        }
        if (newValue === null || isNaN(newValue)) {
            onCancel();
            return;
        }
        onSave(parseFloat(newValue));
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>แก้ไขค่ามิเตอร์</h2>
                    <button onClick={onCancel} className={styles.closeButton}><FaTimes /></button>
                </div>
                <div className={styles.modalBody}>
                    <p>กรอกข้อมูลใหม่ของ METER ID: <strong>{record["METER ID"]}</strong></p>
                    <p>on <strong>{new Date(record["DATE TIME"]).toLocaleString()}</strong></p>
                    <input
                        className={styles.input}
                        type="number"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                    />
                </div>
                <div className={styles.modalFooter}>
                    <button onClick={onCancel} className={`${styles.modalButton} ${styles.modalButtonCancel}`}>
                        Cancel
                    </button>
                    <button onClick={handleSave} className={`${styles.modalButton} ${styles.modalButtonOk}`}>
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

const InfoModal = ({ message, onClose, isError = false }) => {
    return (
        <div className={styles.modalOverlay}>
            <div className={styles.infoModalContent}>
                <h2 className={styles.modalTitle}>ข้อความจากระบบ</h2>
                <p className={`${styles.message} ${isError ? styles.messageError : styles.messageSuccess}`}>
                    {message}
                </p>
                <div className={styles.modalFooter}>
                    <button onClick={onClose} className={`${styles.modalButton} ${styles.modalButtonOk}`}>
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManualEdit;