import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../common/DashboardLayout';
import styles from './AlarmListPage.module.css';

// ====================================================
// 🚨 1. AlarmTable Component (ส่วนนี้แก้ไขให้คลิกได้)
// ====================================================
const AlarmTable = ({ title, columns, data, onRowClick }) => { // รับ onRowClick เข้ามา
    
    // กำหนดความกว้างมาตรฐานสำหรับ Header (Fixed Widths)
    const colWidthsMap = { "NO.": "80px", "METER ID": "200px", "METER NAME": "450px", "FACTORY": "150px", "PROCESS": "120px", "LAST LOG DATE": "170px", "CONSUMPTION (m³)": "170px", "MAX CAP": "130px", "Current Reading": "180px", "Previous Reading": "180px", "WMA016": "100px", "BW to WWT-A (m³)": "150px", "R/WM03": "120px", "Spare (m³)": "120px", "A1": "100px", };

    let totalWidth = 0;
    
    const originalGridTemplate = columns.map(col => {
        const width = colWidthsMap[col.Header] || '120px';
        totalWidth += parseInt(width.replace('px', ''), 10);
        return width;
    }).join(' ');

    const noColumnWidth = colWidthsMap["NO."];
    totalWidth += parseInt(noColumnWidth.replace('px', ''), 10);

    const gridTemplate = `${noColumnWidth} ${originalGridTemplate}`;

    const gridStyle = {
        width: `${totalWidth}px`,
        minWidth: `${totalWidth}px`,
        gridTemplateColumns: gridTemplate,
    };

    return (
        <div className={styles.customTableWrapper}> 
            <h2 className={styles.customTableTitle}>{title}</h2>
            
            <div className={styles.customDataTable} style={gridStyle}>
                
                {/* Headers */}
                <div className={styles.customTableHeader}>
                    <div className={`${styles.customHeaderCell} ${styles.centerAlign}`}>NO.</div> 
                    {columns.map((col) => (
                        <div key={col.Header} className={styles.customHeaderCell}>{col.Header}</div>
                    ))}
                </div>
                
                {/* Body */}
                <div className={styles.customTableBody}>
                    {data.map((row, rowIdx) => (
                        // ✅ เพิ่ม onClick และ className เพื่อให้แถวคลิกได้
                        <div 
                            key={rowIdx} 
                            className={`${styles.customTableRow} ${onRowClick ? styles.clickableRow : ''}`}
                            onClick={() => onRowClick && onRowClick(row["METER ID"])}
                        >
                            
                            {/* NO. Cell (ลำดับที่) */}
                            <div className={`${styles.customTableCell} ${styles.centerAlign}`}>
                                {rowIdx + 1}
                            </div>
                            
                            {columns.map((col, cellIdx) => (
                                <div key={cellIdx} className={`${styles.customTableCell}`}>
                                    {row[col.accessor] !== null && row[col.accessor] !== undefined ? String(row[col.accessor]) : 'N/A'}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


// ====================================================
// 2. AlarmListPage Component (ส่วนนี้แก้ไขเพื่อส่ง prop)
// ====================================================
const AlarmListPage = ({ alarmType, apiBaseUrl, onBack, onMeterClick }) => { // ✅ รับ onMeterClick เข้ามา
    
    // --- State Management ---
    const [alarmData, setAlarmData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFactoryFilter, setSelectedFactoryFilter] = useState('ALL'); 

    // เพิ่ม State สำหรับวันที่เข้ามา
    const getTodayDateString = () => new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(getTodayDateString());

    // --- Constants ---
    const ALARM_TYPES = {
        'daily-no-data': { title: 'Total Meter daily no data', endpoint: 'daily-no-data', columns: [ { Header: "METER ID", accessor: "METER ID" }, { Header: "METER NAME", accessor: "METER NAME" }, { Header: "FACTORY", accessor: "FACTORY" }, { Header: "PROCESS", accessor: "PROCESS" } ] },
        'over-consumption': { title: 'Total Meter daily over consumption', endpoint: 'over-consumption', columns: [ { Header: "METER ID", accessor: "METER ID" }, { Header: "METER NAME", accessor: "METER NAME" }, { Header: "FACTORY", accessor: "FACTORY" }, { Header: "CONSUMPTION (m³)", accessor: "CONSUMPTION" }, { Header: "MAX CAP", accessor: "MAX CAP" }, { Header: "Current Reading", accessor: "CURRENT READING" }, { Header: "Previous Reading", accessor: "PREVIOUS READING" } ] },
        'monthly-no-data': { title: 'Total Meter monthly no data', endpoint: 'monthly-no-data', columns: [ { Header: "METER ID", accessor: "METER ID" }, { Header: "METER NAME", accessor: "METER NAME" }, { Header: "FACTORY", accessor: "FACTORY" }, { Header: "PROCESS", accessor: "PROCESS" }, { Header: "LAST LOG DATE", accessor: "LAST LOG DATE" } ] },
    };

    const currentAlarm = ALARM_TYPES[alarmType] || { title: 'ไม่ทราบประเภทการแจ้งเตือน', endpoint: '', columns: [] };

    // --- Fetch Data Logic ---
    const fetchAlarmDetails = useCallback(async () => {
        if (!currentAlarm.endpoint) {
            setError('Invalid alarm type.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            let url = `${apiBaseUrl}/alarms/${currentAlarm.endpoint}`;
            const needsDate = ['daily-no-data', 'over-consumption'].includes(currentAlarm.endpoint);
            if (needsDate && selectedDate) {
                url += `?date=${selectedDate}`;
            }

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Failed to fetch alarm data.');
            }

            const data = await response.json();
            setAlarmData(data);

        } catch (err) {
            console.error('Fetch Alarm Error:', err);
            setError(err.message || 'Server error while fetching alarm data.');
            setAlarmData([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentAlarm.endpoint, apiBaseUrl, selectedDate]);

    // --- Effects ---
    useEffect(() => {
        fetchAlarmDetails();
    }, [fetchAlarmDetails]);
    
    // --- Filter Logic & Derived Data ---
    const factoriesList = Array.from(new Set(alarmData.map(item => item.FACTORY))).sort();

    const filteredData = alarmData.filter(item => {
        const factoryMatch = selectedFactoryFilter === 'ALL' || item.FACTORY === selectedFactoryFilter;
        if (!factoryMatch) return false;

        if (searchQuery.trim() === '') {
            return true;
        }

        const lowerCaseQuery = searchQuery.toLowerCase();
        const meterId = item["METER ID"] ? String(item["METER ID"]).toLowerCase() : '';
        const meterName = item["METER NAME"] ? String(item["METER NAME"]).toLowerCase() : '';

        return meterId.includes(lowerCaseQuery) || meterName.includes(lowerCaseQuery);
    });

    // --- JSX Render Helpers ---

    const headerTitle = (
        <React.Fragment>
            🚨 {currentAlarm.title}
        </React.Fragment>
    );

    const headerControls = (
        <button className={styles.backButton} onClick={onBack}>
            ← กลับหน้าหลัก
        </button>
    );

    const FilterSection = () => {
        const showDatePicker = ['daily-no-data', 'over-consumption'].includes(alarmType);
        return (
            <div className={styles.filterBar}>
                {showDatePicker && (
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>📅 เลือกวันที่:</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                )}
                <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>🔍 ค้นหา มิเตอร์:</label>
                    <input
                        type="text"
                        placeholder="Meter ID หรือ Meter Name"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                {factoriesList.length > 0 && (
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>🏢 Factory:</label>
                        <select
                            value={selectedFactoryFilter}
                            onChange={(e) => setSelectedFactoryFilter(e.target.value)}
                            className={styles.selectInput}
                        >
                            <option value="ALL">-- All --</option>
                            {factoriesList.map(factory => (
                                <option key={factory} value={factory}>{factory}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        );
    };
    
    let tableContent;
    if (isLoading) {
        tableContent = <div className={styles.loadingState}>กำลังโหลดรายการแจ้งเตือน...</div>;
    } else if (error) {
        tableContent = <div className={styles.errorState}>{error}</div>;
    } else if (filteredData.length === 0) {
        tableContent = <div className={styles.noDataState}>✅ ไม่พบมิเตอร์ที่เข้าเกณฑ์การแจ้งเตือน</div>;
    } else {
        tableContent = (
            <AlarmTable 
                title={`Item List (Total ${filteredData.length} Item)`}
                columns={currentAlarm.columns}
                data={filteredData}
                // ✅ ส่งฟังก์ชัน onMeterClick ต่อไปให้ AlarmTable
                onRowClick={onMeterClick} 
            />
        );
    }

    const tableComponent = (
        <div className={styles.tableContainer}>
            {tableContent}
        </div>
    );

    // --- Main Render ---
    return (
        <DashboardLayout
            title={headerTitle}
            headerControls={headerControls}
            filterSection={!isLoading ? <FilterSection /> : null}
            chart={null}
            table={tableComponent}
            isChartLoading={false}
            chartDataAvailable={false}
            alarmType={alarmType}
        />
    );
};

export default AlarmListPage;