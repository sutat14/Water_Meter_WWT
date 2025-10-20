// src/utils/consumptionCalculations.js

export const calculateConsumptionForSelectedDay = (fetchedData, selectedDate) => {
    const dailyDataByMeter = {};
    const groupedData = fetchedData.reduce((acc, item) => {
        const meterId = item["METER ID"];
        const date = new Date(item["DATE TIME"]).toLocaleDateString('en-CA');
        
        if (!acc[meterId]) acc[meterId] = {};
        if (!acc[meterId][date] || new Date(item["DATE TIME"]) > new Date(acc[meterId][date]["DATE TIME"])) {
            acc[meterId][date] = item;
        }
        return acc;
    }, {});
    
    Object.keys(groupedData).forEach(meterId => {
        const dates = Object.keys(groupedData[meterId]).sort();
        const selectedDateString = new Date(selectedDate).toLocaleDateString('en-CA');
        const selectedDayIndex = dates.indexOf(selectedDateString);

        if (selectedDayIndex !== -1) {
            const currentRecord = groupedData[meterId][selectedDateString];
            let consumption = null; 
            
            let previousRecord = null;
            for (let i = selectedDayIndex - 1; i >= 0; i--) {
                const prevDate = dates[i];
                const record = groupedData[meterId][prevDate];
                if (record && record["Data METER"] !== null && record["Data METER"] !== undefined) {
                    previousRecord = record;
                    break;
                }
            }
            
            if (currentRecord["Data METER"] !== null && currentRecord["Data METER"] !== undefined && previousRecord) {
                let diff = currentRecord["Data METER"] - previousRecord["Data METER"];
                if (diff < 0) {
                    const maxMeter = parseFloat(previousRecord["MAX METER"]) || 1000000;
                    diff += maxMeter;
                }
                consumption = Math.max(0, diff);
            }
            
            dailyDataByMeter[meterId] = { ...currentRecord, "CONSUMPTION": consumption };
        }
    });
    
    return Object.values(dailyDataByMeter);
};


export const calculateLatestConsumptionForTable = (fetchedData) => {
    const sortedData = fetchedData.sort((a, b) => new Date(a["DATE TIME"]) - new Date(b["DATE TIME"]));
    const groupedDataByMeterAndDate = sortedData.reduce((acc, item) => {
        const meterId = item["METER ID"];
        const date = new Date(item["DATE TIME"]).toLocaleDateString('en-CA');
        if (!acc[meterId]) acc[meterId] = {};
        acc[meterId][date] = item;
        return acc;
    }, {});
    const finalRecords = [];
    Object.keys(groupedDataByMeterAndDate).forEach(meterId => {
        const dates = Object.keys(groupedDataByMeterAndDate[meterId]).sort();
        const latestDate = dates[dates.length - 1];
        const latestRecord = groupedDataByMeterAndDate[meterId][latestDate];
        let consumption = 0;
        if (dates.length > 1) {
            const previousDate = dates[dates.length - 2];
            const previousRecord = groupedDataByMeterAndDate[meterId][previousDate];
            if (previousRecord) {
                let diff = latestRecord["Data METER"] - previousRecord["Data METER"];
                if (diff < 0) {
                    const maxMeter = parseFloat(previousRecord["MAX METER"]) || 1000000;
                    diff += maxMeter;
                }
                consumption = Math.max(0, diff);
            }
        }
        finalRecords.push({ ...latestRecord, "CONSUMPTION": consumption });
    });
    finalRecords.sort((a, b) => a["METER ID"].localeCompare(b["METER ID"], undefined, { numeric: true, sensitivity: 'base' }));
    
    return finalRecords;
};

export const calculateDailyConsumption = (data) => {
    const groupedDataByMeter = data.reduce((acc, item) => {
        const meterId = item["METER ID"];
        if (!acc[meterId]) acc[meterId] = [];
        acc[meterId].push(item);
        return acc;
    }, {});

    const dailyConsumption = {};

    Object.keys(groupedDataByMeter).forEach(meterId => {
        const sortedData = groupedDataByMeter[meterId].sort((a, b) => new Date(a["DATE TIME"]) - new Date(b["DATE TIME"]));
        const meterReadings = {};

        sortedData.forEach(item => {
            const date = new Date(item["DATE TIME"]).toLocaleDateString('en-CA');
            if (!meterReadings[date] || new Date(item["DATE TIME"]) > new Date(meterReadings[date]["DATE TIME"])) {
                meterReadings[date] = item;
            }
        });

        const sortedDates = Object.keys(meterReadings).sort();
        
        for (let i = 1; i < sortedDates.length; i++) {
            const currentDate = sortedDates[i];
            const previousDate = sortedDates[i - 1];
            const currentReading = meterReadings[currentDate]["Data METER"];
            const previousReading = meterReadings[previousDate]["Data METER"];
            
            if (currentReading !== null && previousReading !== null) {
                let consumption = currentReading - previousReading;
                if (consumption < 0) {
                    const maxMeter = parseFloat(meterReadings[previousDate]["MAX METER"]) || 1000000;
                    consumption += maxMeter;
                }
                const recordKey = `${meterId}-${currentDate}`;
                dailyConsumption[recordKey] = Math.max(0, consumption);
            }
        }
    });

    return dailyConsumption;
};