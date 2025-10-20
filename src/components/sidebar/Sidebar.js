import React from 'react';
// ต้องเพิ่ม FaPlus เข้ามาใน import ด้วย
import { FaBars, FaEdit, FaCogs, FaSignOutAlt, FaSignInAlt, FaPlus, FaTrash } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleMenu, setView, token, handleLogout, handleLogin }) => {
    return (
        <>
            {/* Overlay */}
            {isOpen && <div className="overlay" onClick={toggleMenu}></div>}

            {/* Sidebar Menu */}
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <button onClick={toggleMenu} className="close-btn">
                        <FaBars />
                    </button>
                </div>
                <ul className="menu-list">
                    {/* แสดงเมนูสำหรับผู้ดูแลระบบเมื่อมี token */}
                    {token && (
                        <>
                            <li>
                                <button onClick={() => { setView('add-meter'); toggleMenu(); }} className="menu-item">
                                    <FaPlus className="menu-icon" /> เพิ่มข้อมูลมิเตอร์
                                </button>
                            </li>
                             <li>
                                <button onClick={() => { setView('delete-meter'); toggleMenu(); }} className="menu-item">
                                    <FaTrash className="menu-icon" /> ลบข้อมูลมิเตอร์
                                </button>
                            </li>
                            <li>
                                <button onClick={() => { setView('manual-edit'); toggleMenu(); }} className="menu-item">
                                    <FaEdit className="menu-icon" /> แก้ไขข้อมูลมิเตอร์
                                </button>
                            </li>
                            <li>
                                <button onClick={() => { setView('wastewater-edit'); toggleMenu(); }} className="menu-item">
                                    <FaCogs className="menu-icon" /> แก้ไขข้อมูลทั่วไป
                                </button>
                            </li>
                            <li>
                                <button onClick={() => { handleLogout(); toggleMenu(); }} className="menu-item">
                                    <FaSignOutAlt className="menu-icon" /> ออกจากระบบ
                                </button>
                            </li>
                        </>
                    )}

                    {/* แสดงปุ่มเข้าสู่ระบบเมื่อไม่มี token */}
                    {!token && (
                        <li>
                            <button onClick={() => { handleLogin(); toggleMenu(); }} className="menu-item">
                                <FaSignInAlt className="menu-icon" /> เข้าสู่ระบบ
                            </button>
                        </li>
                    )}
                </ul>
            </div>
        </>
    );
};

export default Sidebar;
