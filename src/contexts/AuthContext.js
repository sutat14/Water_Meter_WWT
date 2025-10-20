import React, { createContext, useContext, useState, useMemo } from 'react';

// 1. สร้าง Context Object
const AuthContext = createContext(null);

// 2. Custom Hook สำหรับเรียกใช้ Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 3. Provider Component
export const AuthProvider = ({ children }) => {
  // state ของ Token จะถูกเก็บอยู่ที่นี่
  const [token, setToken] = useState(null); 
  

  // ใช้ useMemo เพื่อป้องกันการ re-render ที่ไม่จำเป็น
  const authContextValue = useMemo(() => ({
    token,
    setToken,
    isAuthenticated: !!token,
  }), [token]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

