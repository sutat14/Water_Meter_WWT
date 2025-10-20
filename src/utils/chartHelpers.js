// src/utils/chartHelpers.js

import { calculateDailyConsumption } from './consumptionCalculations';

export const prepareFactoryChartData = (data) => {
    const meterConsumption = {};
    const meterMaxCap = {};
    data.forEach(item => {
        meterConsumption[item["METER ID"]] = item["CONSUMPTION"];
        meterMaxCap[item["METER ID"]] = item["MAX CAP"];
    });
    const sortedMeterIds = Object.keys(meterConsumption).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
    const sortedConsumptionData = sortedMeterIds.map(id => meterConsumption[id]);
    const sortedMaxCapData = sortedMeterIds.map(id => meterMaxCap[id]);

    return {
        labels: sortedMeterIds,
        datasets: [
            {
                type: 'bar',
                label: 'ปริมาณการใช้น้ำ (m³)',
                data: sortedConsumptionData,
                backgroundColor: 'rgba(52, 152, 219, 0.6)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1,
                yAxisID: 'y-axis-consumption',
            },
            {
                type: 'line',
                label: 'ความจุสูงสุด (m³)',
                data: sortedMaxCapData,
                fill: false,
                borderColor: 'rgba(255, 99, 132, 0.8)',
                backgroundColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                tension: 0.4,
                yAxisID: 'y-axis-maxcap',
            },
        ],
    };
};

export const prepareMeterChartData = (data) => {
    if (!data || data.length === 0) {
        return { labels: [], datasets: [] };
    }
    
    const dailyConsumption = calculateDailyConsumption(data);
    const labels = Object.keys(dailyConsumption);
    const consumptionData = Object.values(dailyConsumption);
    const meterInfo = data.find(item => item["MAX CAP"] !== null) || {};
    const maxCapValue = meterInfo['MAX CAP'];

    const datasets = [{
        label: 'ปริมาณการใช้น้ำ (m³)',
        data: consumptionData,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
    }];
    if (maxCapValue !== null && maxCapValue !== undefined) {
        datasets.push({
            type: 'line',
            label: 'ความจุสูงสุด (m³)',
            data: labels.map(() => maxCapValue),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
        });
    }

    return { labels: labels, datasets: datasets };
};