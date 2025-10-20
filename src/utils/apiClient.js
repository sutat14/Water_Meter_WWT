// src/utils/apiClient.js

const API_BASE_URL = 'http://localhost:5000/api';

const handleApiResponse = async (response) => {
    if (response.status === 401) {
        // แจ้งเตือนผู้ใช้ว่าเซสชันหมดอายุ
        alert('Session expired. Please log in again.');
        // นำผู้ใช้กลับไปหน้า login
        // คุณอาจใช้ window.location.href หรือ useNavigate() จาก React Router
        window.location.href = '/login'; 
        return;
    }

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error');
    }

    return response.json();
};

export const fetchData = async (endpoint, token) => {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return handleApiResponse(response);
};

export const updateData = async (endpoint, data, token) => {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
    return handleApiResponse(response);
};