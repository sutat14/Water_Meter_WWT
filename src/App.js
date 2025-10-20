import React, { useState, useEffect, useCallback } from 'react';
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    BarElement, 
    LineElement, 
    PointElement, 
    Title, 
    Tooltip, 
    Legend 
} from 'chart.js';

// --- Component Imports ---
import './App.css';
import OverviewDashboard from './components/overview/OverviewDashboard';
import IndividualMonitor from './components/individual/IndividualMonitor';
import Login from './components/admin/Login';
import ManualEdit from './components/admin/ManualEdit';
import Sidebar from './components/sidebar/Sidebar';
import WastewaterEdit from './components/admin/WastewaterEdit';
import AddMeter from './components/admin/AddMeter';
import DeleteMeter from './components/admin/DeleteMeter';
import AlarmListPage from './components/alarm/AlarmListPage'; 

// --- Utility & Hook Imports ---
import { 
    calculateConsumptionForSelectedDay, 
    calculateLatestConsumptionForTable, 
    prepareFactoryChartData, 
    prepareMeterChartData 
} from './utils';
import useDataFetching from './hooks/useDataFetching';
import { AuthProvider } from './contexts/AuthContext';

// =================================================================
// 1. CONFIGURATION & CHART SETUP
// =================================================================

ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend
);

const apiBaseUrl = 'http://localhost:5000/api';
const factories = ['A1', 'A', 'B', 'C1', 'C2', 'D', 'OTHER'];
const DATA_FETCH_INTERVAL = 300000; // 5 minutes in milliseconds

// =================================================================
// 2. APP CONTENT COMPONENT
// =================================================================

const AppContent = () => {
    // --- State Management ---
    const [view, setView] = useState('overview');
    const [token, setToken] = useState(null);
    const [selectedFactory, setSelectedFactory] = useState('A1');
    const [selectedMeter, setSelectedMeter] = useState(null);
    const [filter, setFilter] = useState('monthly');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [allMeters, setAllMeters] = useState([]);
    const [alarmType, setAlarmType] = useState(null);

    // --- Data Fetching Hooks ---
    const { 
        isLoading: isFactoryLoading, 
        data: factoryData, 
        chartData: factoryChartData, 
        fetchData: fetchFactoryData 
    } = useDataFetching(apiBaseUrl);

    const { 
        isLoading: isMeterLoading, 
        data: meterData, 
        chartData: meterChartData, 
        fetchData: fetchMeterData 
    } = useDataFetching(apiBaseUrl);

    // --- Data Fetching Utilities (Callbacks) ---

    const fetchAllMeters = useCallback(async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/meters`);
            const meters = await response.json();
            setAllMeters(meters);
        } catch (error) {
            console.error('Error fetching all meters:', error);
            setAllMeters([]);
        }
    }, []);

    // --- Handlers (Callbacks) ---

    const handleDateRangeChange = useCallback((newStartDate, newEndDate) => {
        setStartDate(newStartDate);
        setEndDate(newEndDate);
        fetchMeterData(
            `water-meter-data-by-meter-and-date/${selectedMeter}?start=${newStartDate}&end=${newEndDate}`, 
            fetchedData => fetchedData,
            prepareMeterChartData
        );
    }, [fetchMeterData, selectedMeter]);

    const handleDailyDateChange = useCallback((date) => {
        setSelectedDate(date);
        fetchFactoryData(
            `water-meter-data-by-factory/${selectedFactory}`, 
            data => calculateConsumptionForSelectedDay(data, date), 
            prepareFactoryChartData
        );
    }, [fetchFactoryData, selectedFactory]);

    const handleBackToOverview = useCallback(() => {
        setView('overview');
        setSelectedMeter(null);
        setStartDate('');
        setEndDate('');
        setAlarmType(null);
    }, []);

    const handleMonthlyFilter = useCallback(() => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = today;
        setFilter('monthly');
        handleDateRangeChange(startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0]);
    }, [handleDateRangeChange]);
    
    const handleWeeklyFilter = useCallback(() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const startOfWeek = new Date(today.setDate(diffToMonday));
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        setFilter('weekly');
        handleDateRangeChange(startOfWeek.toISOString().split('T')[0], endOfWeek.toISOString().split('T')[0]);
    }, [handleDateRangeChange]);
    
    const handleMeterClick = useCallback((meterId) => {
        setSelectedMeter(meterId);
        setView('individual');
    }, []);

    const handleLoginSuccess = useCallback((userToken) => {
        setToken(userToken);
        setView('overview');
    }, []);

    const handleLogout = useCallback(() => {
        setToken(null);
        setView('overview');
    }, []);

    const toggleMenu = useCallback(() => {
        setIsMenuOpen(prev => !prev);
    }, []);

    const handleViewAlarm = useCallback((type) => {
        setAlarmType(type);
        setView('alarm-list');
    }, []);

    // --- Effects ---

    // Effect for fetching all meter names initially
    useEffect(() => {
        fetchAllMeters();
    }, [fetchAllMeters]);

    // Effect for fetching factory data (Overview) or meter data (Individual)
    useEffect(() => {
        if (view === 'overview') {
            const dataProcessor = selectedDate 
                ? (data) => calculateConsumptionForSelectedDay(data, selectedDate) 
                : calculateLatestConsumptionForTable;
            
            const fetchOverview = () => fetchFactoryData(
                `water-meter-data-by-factory/${selectedFactory}`, 
                dataProcessor, 
                prepareFactoryChartData
            );

            // Initial fetch
            fetchOverview();
            
            // Set up polling
            const interval = setInterval(fetchOverview, DATA_FETCH_INTERVAL);
            return () => clearInterval(interval);
            
        } else if (view === 'individual' && selectedMeter) {
            // If viewing individual meter but date range hasn't been set, set default to monthly
            if (!startDate && !endDate) {
                handleMonthlyFilter();
            }
        }
    }, [view, selectedFactory, selectedDate, selectedMeter, startDate, endDate, fetchFactoryData, handleMonthlyFilter]);

    // --- Rendering Logic: Conditional Content ---

    let dashboardContent;
    
    switch (view) {
        case 'login':
            dashboardContent = <Login onLoginSuccess={handleLoginSuccess} onBack={handleBackToOverview} />;
            break;
        case 'manual-edit':
            dashboardContent = token ? <ManualEdit onBack={handleBackToOverview} token={token} /> : <Login onLoginSuccess={handleLoginSuccess} onBack={handleBackToOverview} />;
            break;
        case 'wastewater-edit':
            dashboardContent = token ? <WastewaterEdit onBack={handleBackToOverview} token={token} apiBaseUrl={apiBaseUrl} /> : <Login onLoginSuccess={handleLoginSuccess} onBack={handleBackToOverview} />;
            break;
        case 'add-meter':
            dashboardContent = token ? <AddMeter onBack={handleBackToOverview} token={token} apiBaseUrl={apiBaseUrl} /> : <Login onLoginSuccess={handleLoginSuccess} onBack={handleBackToOverview} />;
            break;
        case 'delete-meter':
            dashboardContent = token ? <DeleteMeter onBack={handleBackToOverview} token={token} apiBaseUrl={apiBaseUrl} /> : <Login onLoginSuccess={handleLoginSuccess} onBack={handleBackToOverview} />;
            break;
        case 'alarm-list':
            dashboardContent = (
                <AlarmListPage 
                    alarmType={alarmType}
                    apiBaseUrl={apiBaseUrl}
                    onBack={handleBackToOverview}
                    // ✅✅✅ จุดแก้ไขคือการเพิ่ม prop นี้เข้าไป ✅✅✅
                    onMeterClick={handleMeterClick}
                />
            );
            break;
        case 'individual':
            if (selectedMeter) {
                dashboardContent = (
                    <IndividualMonitor
                        selectedMeter={selectedMeter}
                        isMeterLoading={isMeterLoading}
                        meterData={meterData}
                        meterChartData={meterChartData}
                        handleWeeklyFilter={handleWeeklyFilter}
                        handleMonthlyFilter={handleMonthlyFilter}
                        filter={filter}
                        startDate={startDate}
                        setStartDate={setStartDate}
                        endDate={endDate}
                        setEndDate={setEndDate}
                        handleDateRangeChange={handleDateRangeChange}
                        setView={handleBackToOverview} // Renamed prop for clarity in context
                    />
                );
            } else {
                // Fallback to Overview if individual is selected but no meter is specified
                dashboardContent = (
                    <OverviewDashboard
                        factories={factories}
                        selectedFactory={selectedFactory}
                        setSelectedFactory={setSelectedFactory}
                        selectedDate={selectedDate}
                        handleDailyDateChange={handleDailyDateChange}
                        isFactoryLoading={isFactoryLoading}
                        factoryChartData={factoryChartData}
                        factoryData={factoryData}
                        allMeters={allMeters}
                        handleMeterClick={handleMeterClick}
                        handleViewAlarm={handleViewAlarm}
                    />
                );
            }
            break;
        case 'overview':
        default:
            dashboardContent = (
                <OverviewDashboard
                    factories={factories}
                    selectedFactory={selectedFactory}
                    setSelectedFactory={setSelectedFactory}
                    selectedDate={selectedDate}
                    handleDailyDateChange={handleDailyDateChange}
                    isFactoryLoading={isFactoryLoading}
                    factoryChartData={factoryChartData}
                    factoryData={factoryData}
                    allMeters={allMeters}
                    handleMeterClick={handleMeterClick}
                    handleViewAlarm={handleViewAlarm}
                />
            );
            break;
    }

    // --- Main Render ---
    return (
        <div className="relative">
            <Sidebar 
                isOpen={isMenuOpen} 
                toggleMenu={toggleMenu} 
                setView={setView} 
                token={token} 
                handleLogout={handleLogout}
                handleLogin={() => setView('login')}
            />
            {dashboardContent}
        </div>
    );
};

// =================================================================
// 3. APP WRAPPER COMPONENT
// =================================================================

const App = () => (
    <AuthProvider>
        <AppContent />
    </AuthProvider>
);

export default App;