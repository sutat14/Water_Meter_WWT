import React from 'react';
import { FaSave, FaPlus, FaTrash } from 'react-icons/fa';
// Import CSS กลางที่เราจะสร้างในขั้นตอนถัดไป
import styles from './SharedMeterStyles.module.css';

// กำหนด state เริ่มต้นของฟอร์ม เพื่อใช้สร้าง input fields
const formFields = [
    { name: 'meter_id', type: 'text' },
    { name: 'meter_name', type: 'text' },
    { name: 'type', type: 'text' },
    { name: 'factory', type: 'text' },
    { name: 'process', type: 'text' },
    { name: 'max_cap', type: 'number' },
    { name: 'max_meter', type: 'number' },
    { name: 'period', type: 'text' },
];

const MeterFormUI = ({ record, onRecordChange, onSubmit, loading, mode }) => {
    
    // ตั้งค่าปุ่มตามโหมดที่ได้รับมา
    const config = {
        add: {
            text: 'เพิ่มข้อมูล',
            icon: <FaPlus className={styles.icon} />,
            className: `${styles.actionButton} ${styles.primaryButton}`,
        },
        edit: {
            text: 'บันทึกข้อมูล',
            icon: <FaSave className={styles.icon} />,
            className: `${styles.actionButton} ${styles.primaryButton}`,
        },
        delete: {
            text: 'ยืนยันการลบ',
            icon: <FaTrash className={styles.icon} />,
            className: `${styles.actionButton} ${styles.dangerButton}`,
        },
    }[mode];

    return (
        <form onSubmit={onSubmit} className={styles.recordForm}>
            <div className={styles.dataEditFormGrid}>
                {formFields.map(({ name, type }) => (
                    <div className={styles.inputGroup} key={name}>
                        <label className={styles.inputLabel}>{name.replace('_', ' ').toUpperCase()}</label>
                        <input
                            type={type}
                            name={name}
                            value={record[name] || ''}
                            onChange={onRecordChange}
                            disabled={loading || mode === 'delete' || (mode === 'edit' && name === 'meter_id')}
                            required={mode !== 'delete'}
                            className={styles.formInput}
                            autoComplete="off"
                        />
                    </div>
                ))}
            </div>

            <div className={styles.buttonContainer}>
                <button type="submit" className={config.className} disabled={loading}>
                    {config.icon} {config.text}
                </button>
            </div>
        </form>
    );
};

export default MeterFormUI;