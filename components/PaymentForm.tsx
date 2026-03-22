'use client';

interface PaymentFormProps {
  onOpenCardModal: () => void;
  onOpenSepaModal: () => void;
  onOpenPayPal: () => void;
}

export default function PaymentForm({ onOpenCardModal, onOpenSepaModal, onOpenPayPal }: PaymentFormProps) {
  return (
    <div className="payment-card">
      <div className="payment-header">
        <h1>Offene Forderung begleichen</h1>
        <i className="fas fa-wallet" style={{ fontSize: '22px', color: 'var(--gov-blue)' }}></i>
      </div>
      <div className="payment-content">
        <div className="payment-options">
          <div className="paypal-button" onClick={onOpenPayPal}>
            <img src="/p_icon.svg" height="22" alt="PayPal" />
          </div>
          <button className="card-button" onClick={onOpenCardModal}>
            <i className="fas fa-credit-card"></i> Kredit- oder Debitkarte
          </button>
          <button className="sepa-button" onClick={onOpenSepaModal}>
            <img src="/plico.png" height="18" style={{ maxWidth: '160px', objectFit: 'contain' }} alt="SEPA" />
          </button>
        </div>

        <div className="security-info">
          <i className="fas fa-shield-alt" style={{ fontSize: '20px', marginTop: '2px' }}></i>
          <div>
            <strong>Sichere Datenübermittlung</strong>
            <br />
            <span>
              Die Übertragung erfolgt SSL-verschlüsselt an die Server der Finanzverwaltung Hamburg. 
              Ihre Daten werden gemäß <strong>DSGVO</strong> und <strong>AO</strong> vertraulich behandelt.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


