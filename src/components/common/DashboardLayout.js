// src/components/common/DashboardLayout.js

import React from 'react';
import styles from '../individual/IndividualMonitor.module.css'; 

const DashboardLayout = ({
    title,
    headerControls,
    filterSection,
    chart,
    table,
    isChartLoading,
    chartDataAvailable,
    // ไม่จำเป็นต้องใช้ alarmType ในการควบคุม filterSection
}) => {
    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.headerSection}>
                <h1 className={styles.mainTitle}>
                    {title}
                </h1>
                <div className={styles.headerControls}>
                    {headerControls}
                </div>
            </div>

            {/* 🚨 แก้ไขตรงนี้: ลบเงื่อนไข !alarmType ออก และใช้เงื่อนไขพื้นฐานแทน */}
            {filterSection && (
                <div className={styles.filterSection}>
                    {filterSection}
                </div>
            )}
            
            <div className={styles.content}>
                {/* ✨ เพิ่มเงื่อนไขครอบตรงนี้: ถ้ามี chart ส่งเข้ามา (ไม่ใช่ null) ค่อยแสดงผลส่วนนี้ */}
                {chart && (
                    <>
                        {isChartLoading ? (
                            <div className={styles.loadingState}>กำลังโหลดข้อมูลกราฟ...</div>
                        ) : chartDataAvailable ? (
                            <div className={styles.chartContainer}>
                                {chart}
                            </div>
                        ) : (
                            <div className={styles.noDataState}>ไม่พบข้อมูลสำหรับกราฟนี้</div>
                        )}
                    </>
                )}

                {/* ส่วนของ table ยังอยู่เหมือนเดิม */}
                {table}
            </div>

            {/* Footer */}
            <footer className={styles.footer}>
                <p>© 2025 Water Consumption Dashboard. All Rights Reserved.</p>
            </footer>
        </div>
    );
};

export default DashboardLayout;