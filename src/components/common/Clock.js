import React, { useState, useEffect } from 'react';

const Clock = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Create an array of abbreviated month names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Format the date part (e.g., '20 Sep 2025')
    const formattedDate = 
        String(currentTime.getDate()).padStart(2, '0') + ' ' +
        monthNames[currentTime.getMonth()] + ' ' +
        currentTime.getFullYear();

    // Format the time part (e.g., '12:03:24')
    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    return (
        <div className="last-updated-box">
             {formattedDate} 🕒 {formattedTime}
        </div>
    );
};

export default Clock;