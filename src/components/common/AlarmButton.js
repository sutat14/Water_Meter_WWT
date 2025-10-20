import React from 'react';
import styles from './AlarmButton.module.css'; // 1. เปิดใช้งาน import CSS Module

const AlarmButton = ({ title, count, isLoading, onClick }) => {
    
    // 2. เปลี่ยนชื่อตัวแปรจาก string เป็นการอ้างอิง object 'styles'
    // ถ้า count > 0 ให้ใช้คลาส 'alarmActive', ถ้าไม่ ให้ใช้ 'alarmNormal'
    const statusClass = (count > 0 && !isLoading) ? styles.alarmActive : styles.alarmNormal;
    
    return (
        <button 
            // 3. แก้ไข className ให้เรียกใช้จาก object 'styles'
            // ใช้ template literal `` เพื่อรวมคลาสพื้นฐานกับคลาสสถานะ
            className={`${styles.alarmButton} ${statusClass}`} 
            onClick={onClick}
            disabled={isLoading}
        >
            <div className={styles.alarmTitle}>{title}</div>
            <div className={styles.alarmCount}>
                {isLoading ? '...' : count}
            </div>
        </button>
    );
};

export default AlarmButton;