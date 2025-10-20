import React, { useState } from 'react';
// import { FaArrowLeft, FaUser } from 'react-icons/fa';
import styles from './Login.module.css'; // นำเข้าไฟล์ CSS Modules

const Login = ({ onLoginSuccess, onBack }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();
                onLoginSuccess(data.token);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Login failed.');
            }
        } catch (err) {
            setError('Failed to connect to the server.');
        }
    };

    return (
        <div className={styles.loginPageContainer}>
            <div className={styles.loginCardContainer}>
                <h2 className={styles.loginFormTitle}>เข้าสู่ระบบ</h2>
                <form onSubmit={handleLogin} className={styles.loginForm}>
                    <div className={styles.loginInputGroup}>
                        <label className={styles.loginInputLabel} htmlFor="username">
                            ชื่อผู้ใช้
                        </label>
                        <input
                            className={styles.loginFormInput}
                            id="username"
                            type="text"
                            placeholder="Witchuta.S"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className={styles.loginInputGroup}>
                        <label className={styles.loginInputLabel} htmlFor="password">
                            รหัสผ่าน
                        </label>
                        <input
                            className={styles.loginFormInput}
                            id="password"
                            type="password"
                            placeholder="******************"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    {error && <p className={styles.loginErrorMessage}>{error}</p>}
                    <div className={styles.loginFormButtonsContainer}>
                        <button className={styles.loginFormButton + " " + styles.loginFormButtonPrimary} type="submit">
                            📥 เข้าสู่ระบบ
                        </button>
                        <button
                            className={styles.loginFormButton + " " + styles.loginFormButtonSecondary}
                            type="button"
                            onClick={onBack}
                        >
                            🔙 กลับหน้าหลัก
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
