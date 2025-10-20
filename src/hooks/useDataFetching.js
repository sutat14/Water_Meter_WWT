// src/hooks/useDataFetching.js

import { useState, useCallback } from 'react';

const useDataFetching = (apiBaseUrl) => {
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState([]);
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });

    const fetchData = useCallback(async (endpoint, dataProcessor, chartProcessor) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${apiBaseUrl}/${endpoint}`);
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`Data not found on server for endpoint: ${endpoint}`);
                    setData([]);
                    setChartData({ labels: [], datasets: [] });
                    return;
                }
                throw new Error(`Server responded with status: ${response.status}`);
            }
            const fetchedData = await response.json();
            const processedData = dataProcessor(fetchedData);
            setData(processedData);
            if (chartProcessor) {
                setChartData(chartProcessor(processedData));
            }
        } catch (error) {
            console.error(`Error fetching data from ${endpoint}:`, error);
            setData([]);
            setChartData({ labels: [], datasets: [] });
        } finally {
            setIsLoading(false);
        }
    }, [apiBaseUrl]);

    return { isLoading, data, chartData, fetchData };
};

export default useDataFetching;