import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import App from './App';  // หน้าแสดงข้อมูลทั่วไป
import MeterDetail from './MeterReport';  // หน้าสำหรับแสดงข้อมูลมิเตอร์

function Root() {
  return (
    <Router>
      <Routes>
        {/* เส้นทางสำหรับหน้าแสดงข้อมูลทั่วไป */}
        <Route path="/" element={<App />} />
        
        {/* เส้นทางสำหรับหน้ารายละเอียดมิเตอร์ */}
        <Route path="/meter-detail/:meterId" element={<MeterDetail />} />
      </Routes>
    </Router>
  );
}

export default Root;
