// src/components/individual/IndividualMonitor.js (ฉบับแก้ไขที่สมบูรณ์)

import React from 'react';
import DashboardLayout from '../common/DashboardLayout';
import Clock from '../common/Clock';
import Chart from '../common/Chart';
import Table from '../common/Table';
import meterIcon from '../../assets/Icon_meter.png';
import styles from './IndividualMonitor.module.css';

// --- Utility Functions ---
const getChartOptions = (selectedMeter, maxCapValue) => {
    const meterName = typeof selectedMeter === 'string' ? selectedMeter : selectedMeter?.name || selectedMeter?.meterName || 'ไม่ระบุมิเตอร์';
    return {
        responsive: true,
        plugins: { legend: { position: 'top' }, title: { display: true, text: `ปริมาณการใช้น้ำของมิเตอร์ - ${meterName}`, font: { size: 15, weight: 'bold' }, padding: { top: 20, bottom: 20 }, color: '#333', backgroundColor: '#f0f4f8', borderColor: '#d1d5db', borderWidth: 2, borderRadius: 8, }, },
        maintainAspectRatio: false,
        animation: { duration: 1000, easing: 'easeInOutQuad' },
        scales: { x: { ticks: { maxRotation: 45, minRotation: 45, autoSkip: true, }, }, y: { type: 'linear', position: 'left', display: true, title: { display: true, text: 'ปริมาณการใช้น้ำ (m³)', font: { size: 12 }, }, ticks: { callback: value => value.toLocaleString() } }, y1: { type: 'linear', position: 'right', display: true, grid: { drawOnChartArea: false, }, title: { display: true, text: 'Max Cap (m³)/Day', font: { size: 12 }, }, ticks: { callback: value => value.toLocaleString(), }, min: 0, max: maxCapValue ? maxCapValue * 1.1 : undefined, } }
    };
};

const convertToCSV = (data) => {
    const headers = ["METER ID", "METER NAME", "PROCESS", "DATE TIME", "Data METER", "CONSUMPTION (m³)", "STATUS", "Record ID", "MAX CAP (m³)"];
    const csvRows = [headers.join(',')];
    data.forEach(item => {
        const values = headers.map(header => {
            const keyMap = { "CONSUMPTION (m³)": "CONSUMPTION", "MAX CAP (m³)": "MAX CAP" };
            const key = keyMap[header] || header;
            const value = item[key] !== undefined ? item[key] : '';
            return `"${value}"`;
        });
        csvRows.push(values.join(','));
    });
    return csvRows.join('\n');
};

// --- Main Component ---
const IndividualMonitor = ({
    selectedMeter, isMeterLoading, meterData = [], meterChartData = { labels: [], datasets: [] },
    handleWeeklyFilter, handleMonthlyFilter, filter,
    startDate, setStartDate, endDate, setEndDate, handleDateRangeChange,
    setView,
}) => {
    
    const meterName = typeof selectedMeter === 'string' ? selectedMeter : selectedMeter?.name || selectedMeter?.meterName || 'ไม่ระบุมิเตอร์';
    const maxCapValue = Math.max(...meterData.map(item => parseFloat(item["MAX CAP"]) || 0));
    const chartOptions = getChartOptions(selectedMeter, maxCapValue);
    
    const sortedMeterData = [...meterData].sort((a, b) => new Date(b['DATE TIME']) - new Date(a['DATE TIME']));

    const tableDisplayData = sortedMeterData.map((currentRow, index, array) => { 
        const dataMeterDisplay = currentRow["Data METER"] || "❓";
        let dateTimeDisplay = '❓';
        if (currentRow["DATE TIME"]) {
            const dateObj = new Date(currentRow["DATE TIME"]);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const formattedDate = String(dateObj.getDate()).padStart(2, '0') + ' ' + monthNames[dateObj.getMonth()] + ' ' + dateObj.getFullYear();
            const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            dateTimeDisplay = `${formattedDate} 🕒 ${formattedTime}`;
        }
        const recordIdDisplay = currentRow["Record ID"] || "🧑‍🔧";
        const maxCap = parseFloat(currentRow["MAX CAP"]);
 

        let consumptionValue = 0;
        let statusValue = 'Normal';

        if (index === 0) {
            consumptionValue = 0;
            statusValue = 'Normal';
        } else {
            const previousDayRow = array[index - 1];
            if (previousDayRow && currentRow["Data METER"] != null && previousDayRow["Data METER"] != null) {
                const previousDayReading = parseFloat(previousDayRow["Data METER"]);
                const currentReading = parseFloat(currentRow["Data METER"]);
                let diff = previousDayReading - currentReading;
                if (diff < 0) {
                    // This case is likely a meter reset or an anomaly. In a real-world scenario,
                    // this might be flagged, but for calculation, treating it as 0 is safer than
                    // assuming a full rollover if it's just a small negative number.
                    // If it is a true rollover, the logic would need to be more complex.
                    // For now, if the number goes backward, consumption for that period is 0.
                    diff = 0;
                }
                consumptionValue = Math.round(diff);
                if (consumptionValue > maxCap) {
                    statusValue = 'Exceeded';
                }
            }
        }
        
        return {
            "METER ID": currentRow["METER ID"],
            "METER NAME": currentRow["METER NAME"],
            "PROCESS": currentRow["PROCESS"] || "WT", 
            "DATE TIME": dateTimeDisplay,
            "Data METER": dataMeterDisplay,
            "CONSUMPTION": consumptionValue,
            "STATUS": statusValue,
            "Record ID": recordIdDisplay,
            "MAX CAP": currentRow["MAX CAP"]
        };
    });
    
    const tableHeaders = ["METER ID", "METER NAME", "PROCESS", "DATE TIME", "Data METER", "CONSUMPTION (m³)", "STATUS", "Record ID", "MAX CAP (m³)"];

    const updatedMeterChartData = { ...meterChartData, datasets: meterChartData.datasets.map(dataset => ({ ...dataset, yAxisID: dataset.label === 'ความสูงสุด (m³)' ? 'y1' : 'y' })) };
    
    // ✅✅✅ 1. สร้างฟังก์ชัน handleExport ขึ้นมาเพื่อเรียกใช้ convertToCSV ✅✅✅
    const handleExport = () => {
        const csvString = convertToCSV(tableDisplayData);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `report_${meterName}_${startDate}_to_${endDate}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const headerTitle = ( <React.Fragment> <img src={meterIcon} alt="Water Meter Icon" className={styles.icon} /> Water Consumption Dashboard </React.Fragment> );
    const headerControls = ( <React.Fragment> <div className={styles.buttonGroup}> <button className={styles.backButton} id='back-button-individual' onClick={() => setView('overview')} > <i className="fa fa-arrow-left"></i> กลับสู่หน้าหลัก </button> <button className={`${styles.filterButton} ${filter === 'weekly' ? styles.filterButtonActive : ''}`} onClick={handleWeeklyFilter} > รายสัปดาห์ </button> <button className={`${styles.filterButton} ${filter === 'monthly' ? styles.filterButtonActive : ''}`} onClick={handleMonthlyFilter} > รายเดือน </button> </div> <Clock /> </React.Fragment> );
    
    const filterSection = (
        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className={styles.inputGroup}>
                <label className={styles.inputLabel}><i>📅</i> เริ่มต้น</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={styles.dateInput} />
            </div>
            <div className={styles.inputGroup}>
                <label className={styles.inputLabel}><i>📅</i> สิ้นสุด</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={styles.dateInput} />
            </div>
            <button className={styles.fetchButton} onClick={() => handleDateRangeChange(startDate, endDate)} >
                <i className="fa fa-search"></i> เรียกดูข้อมูล
            </button>
            {/* ✅✅✅ 2. เชื่อมปุ่มเข้ากับฟังก์ชัน handleExport ผ่าน onClick ✅✅✅ */}
            <button className={styles.fetchButton} onClick={handleExport}>
                <i className="fa fa-download"></i> ส่งออกข้อมูล (CSV)
            </button>
        </div>
    );
    
    const chartComponent = ( <React.Fragment> <Chart data={updatedMeterChartData} options={chartOptions} chartType="line" /> </React.Fragment> );
    const tableComponent = ( <Table title={`รายงานปริมาณการใช้น้ำของมิเตอร์ - ${meterName}`} headers={tableHeaders} data={tableDisplayData} onRowClick={null} /> );
    
    return (
        <DashboardLayout
            title={headerTitle} headerControls={headerControls} filterSection={filterSection}
            chart={chartComponent} table={tableComponent} isChartLoading={isMeterLoading}
            chartDataAvailable={meterChartData.labels.length > 0}
        />
    );
};

export default IndividualMonitor;