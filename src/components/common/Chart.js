import React, { useRef, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

const Chart = ({ data, options, chartType }) => {
    const isInitialRender = useRef(true);
    const chartOptions = useRef(options); // ใช้ ref เพื่อเก็บตัวเลือก options

    useEffect(() => {
        if (!isInitialRender.current) {
            chartOptions.current.animation = { duration: 0 }; // ปิดแอนิเมชันหลังจากการเรนเดอร์ครั้งแรก
        } else {
            isInitialRender.current = false;
        }
    }, [data]); // การอัปเดตข้อมูลจะกระตุ้น effect ทุกครั้งที่ข้อมูลเปลี่ยนแปลง

    if (chartType === 'bar') {
        return <Bar options={chartOptions.current} data={data} />;
    } else if (chartType === 'line') {
        return <Line options={chartOptions.current} data={data} />;
    }

    return <div className="no-data-state">ไม่พบประเภทของกราฟที่กำหนด</div>;
};

export default Chart;
