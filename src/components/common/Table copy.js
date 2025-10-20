// src/components/common/Table.js

import React from 'react';
import styles from './Table.module.css';

const Table = ({ title, headers, columns, data, onRowClick, dynamicColumns }) => {

  // Logic สำหรับตารางในหน้า Alarm (dynamicColumns = true)
  if (dynamicColumns && columns) {
    const numColumns = columns.length;
    
    // ✨ เริ่มการแก้ไข: เปลี่ยนการกำหนดขนาดคอลัมน์ ✨
    // 1. กำหนดความกว้างเริ่มต้นสำหรับแต่ละคอลัมน์ (เช่น 150px)
    const columnWidth = '150px'; 
    
    // 2. สร้าง string สำหรับ gridTemplateColumns โดยใช้ความกว้างคงที่
    //    (เช่น "150px 150px 150px 150px 150px 150px 150px")
    //    คุณสามารถปรับตัวเลข 150px นี้ให้เหมาะสมกับข้อมูล
    const columnDefinitions = Array(numColumns).fill(columnWidth).join(' '); 

    const gridStyle = { 
      // แก้ไข: ใช้ความกว้างคงที่เพื่อให้ตารางมีความกว้างรวมที่แน่นอนและไม่หดตัว
      gridTemplateColumns: columnDefinitions 
    };
    // ✨ สิ้นสุดการแก้ไข ✨

    return (
      <div className={styles.tableWrapper}> 
        <h2 className={styles.tableTitle}>{title}</h2>
        
        {/* ใช้ inline style ที่สร้างขึ้นมาทับ CSS เดิม */}
        <div className={styles.dataTable} style={gridStyle}>
          
          <div className={styles.tableHeader}>
            {columns.map((col) => (
              <div key={col.Header} className={styles.headerCell}>{col.Header}</div>
            ))}
          </div>
          
          {data.length === 0 ? (
            // .noDataCell จาก CSS ของคุณจะทำงานได้ถูกต้อง (grid-column: 1 / -1)
            <div className={styles.noDataCell}>ไม่มีข้อมูล</div>
          ) : (
            <div className={styles.tableBody}>
              {data.map((row, rowIdx) => (
                <div key={rowIdx} className={styles.tableRow}>
                  {columns.map((col, cellIdx) => (
                    <div key={cellIdx} className={`${styles.tableCell} ${styles.leftAlign}`}>
                      {row[col.accessor] !== null && row[col.accessor] !== undefined ? String(row[col.accessor]) : 'N/A'}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Logic เดิมสำหรับตารางในหน้า OverviewDashboard (จะใช้ CSS เดิมทั้งหมด)
  return (
    <div className={styles.tableWrapper}>
      <h2 className={styles.tableTitle}>{title}</h2>
      <div className={styles.dataTable}> {/* <-- ไม่มีการใช้ inline style ที่นี่ */}
        <div className={styles.tableHeader}>
          {headers.map((header) => (
            <div key={header} className={styles.headerCell}>{header}</div>
          ))}
        </div>

        <div className={styles.tableBody}>
          {data.length === 0 ? (
            <div className={styles.noDataCell}>ไม่มีข้อมูล</div>
          ) : (
            data.map((row, idx) => (
              <div
                key={idx}
                className={styles.tableRow}
                onClick={() => onRowClick?.(row["METER ID"])}
              >
                {/* Cell ต่างๆ ถูก render แบบ Hardcode เหมือนเดิม */}
                <div className={styles.tableCell}>{row["METER ID"]}</div>
                <div className={`${styles.tableCell} ${styles.leftAlign}`}>{row["METER NAME"]}</div>
                <div className={styles.tableCell}>{row["PROCESS"]}</div>
                <div className={styles.tableCell}>
                  {row["DATE TIME"] === 'No data' ? '❓' : row["DATE TIME"]}
                </div>
                <div className={styles.tableCell}>
                  {row["Data METER"] === 'No data' ? '❓' : row["Data METER"]}
                </div>
                <div className={`${styles.tableCell} ${row["STATUS"] === 'Exceeded' ? styles.exceededText : ''}`}>
                  {row["CONSUMPTION"] === 'No data' ? '❓' : row["CONSUMPTION"]}
                </div>
                <div className={styles.tableCell}>
                  <div className={styles.statusCell}>
                    <span
                      className={`${styles.statusDot} ${
                        row["STATUS"] === "Exceeded"
                          ? styles.exceeded
                          : row["STATUS"] === "No data"
                          ? styles.noData
                          : styles.normal
                      }`}
                    ></span>
                    <span>{row["STATUS"]}</span>
                  </div>
                </div>
                <div className={styles.tableCell}>
                  {row["Record ID"] === 'No data' ? '🧑‍🔧' : row["Record ID"]}
                </div>
                <div className={styles.tableCell}>{row["MAX CAP"]}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Table;