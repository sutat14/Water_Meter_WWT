import React from 'react';
import './SuccessModal.css';

const SuccessModal = ({ message, onClose }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">ข้อความจากระบบ</h2>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    <button className="action-button primary" onClick={onClose}>
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuccessModal;