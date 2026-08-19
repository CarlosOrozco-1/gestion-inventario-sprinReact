import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import API from '../services/api';

// Generador de sonido 'beep' con Web Audio API nativo
const playBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz (La)
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (e) {}
};

// Reproducir voz "Código escaneado correctamente" con Web Speech API
const speakSuccess = () => {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('Código escaneado correctamente');
      utterance.lang = 'es-MX';
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const esVoice = voices.find((v) => v.lang.startsWith('es'));
      if (esVoice) utterance.voice = esVoice;
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {}
};

// Sonido de éxito más elaborado (acorde ascendente)
const playSuccessChime = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + i * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + i * 0.12);
      osc.stop(audioCtx.currentTime + i * 0.12 + 0.4);
    });
  } catch (e) {}
};

export default function QrScannerModal({ isOpen, onClose, onSelectInsumo, insumos = [], mode = 'movimiento' }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera', 'file', 'manual'
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannedInsumo, setScannedInsumo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successExiting, setSuccessExiting] = useState(false);

  // Estados para animación de escaneo en archivo subido
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);
  const [isScanningImage, setIsScanningImage] = useState(false);

  const isEditMode = mode === 'edicion';

  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'qr-reader-container';

  // Buscar coincidencia de insumo por texto del QR con alta tolerancia
  const resolveInsumo = async (decodedText) => {
    if (!decodedText) return null;
    const cleanText = decodedText.trim();

    // 1. Coincidencia exacta o por código QR
    let matched = insumos.find(
      (item) =>
        item.codigoQr?.toLowerCase() === cleanText.toLowerCase() ||
        `INS-QR-${item.numero || item.id}-${item.id}`.toLowerCase() === cleanText.toLowerCase()
    );

    // 2. Coincidencia si el QR contiene solo el número (#1 o 1) o ID
    if (!matched) {
      const numMatch = cleanText.replace(/[^0-9]/g, '');
      if (numMatch) {
        matched = insumos.find((item) => item.numero?.toString() === numMatch || item.id?.toString() === numMatch);
      }
    }

    // 3. Coincidencia si el texto contiene la cadena parcial del código
    if (!matched) {
      matched = insumos.find((item) =>
        item.codigoQr && cleanText.toLowerCase().includes(item.codigoQr.toLowerCase())
      );
    }

    // 4. Si no se encontró localmente, consultar a la API backend
    if (!matched) {
      try {
        setLoadingMatch(true);
        const encoded = encodeURIComponent(cleanText);
        const res = await API.get(`/insumos/qr/${encoded}`);
        if (res.data) {
          matched = res.data;
        }
      } catch (err) {
        console.warn('No se encontró insumo en backend por QR:', cleanText);
      } finally {
        setLoadingMatch(false);
      }
    }

    return matched;
  };

  // Manejador cuando se detecta un código QR válido
  const handleScanSuccess = async (decodedText) => {
    playBeep();
    setErrorMsg('');
    setLoadingMatch(true);

    try {
      const foundInsumo = await resolveInsumo(decodedText);
      if (foundInsumo) {
        setScannedInsumo(foundInsumo);
        stopScanner();

        // Mostrar alerta premium de éxito
        setShowSuccessAlert(true);
        setSuccessExiting(false);
        playSuccessChime();
        // Voz: "código escaneado correctamente"
        setTimeout(() => speakSuccess(), 300);

        // Cerrar con animación de salida y abrir formulario correspondiente
        setTimeout(() => {
          setSuccessExiting(true);
          setTimeout(() => {
            setShowSuccessAlert(false);
            setSuccessExiting(false);
            onSelectInsumo(foundInsumo);
            onClose();
          }, 500);
        }, 2500);
      } else {
        setErrorMsg(`Código QR detectado ("${decodedText}"), pero no coincide con ningún insumo registrado.`);
        setIsScanningImage(false);
      }
    } catch (err) {
      setErrorMsg('Error al procesar el código QR escaneado.');
      setIsScanningImage(false);
    } finally {
      setLoadingMatch(false);
    }
  };

  // Iniciar el escáner de cámara con aceleración por hardware
  const startScanner = async (cameraId) => {
    try {
      setErrorMsg('');
      if (html5QrCodeRef.current) {
        await stopScanner();
      }

      // Habilitar BarcodeDetector nativo del navegador para escaneo instantáneo
      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        },
        verbose: false
      });
      html5QrCodeRef.current = html5QrCode;

      // Configuración de escaneo de alto rendimiento y zona dinámica
      const config = {
        fps: 20,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const edge = Math.max(180, Math.floor(minEdge * 0.85));
          return { width: edge, height: edge };
        },
        disableFlip: false
      };

      const cameraParam = cameraId ? { deviceId: { exact: cameraId } } : { facingMode: 'environment' };

      await html5QrCode.start(
        cameraParam,
        config,
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {}
      );
      setScanning(true);
    } catch (err) {
      console.error('Error al iniciar cámara:', err);
      setScanning(false);
      setErrorMsg('No se pudo acceder a la cámara. Verifique los permisos o use Subir Foto o Código.');
    }
  };

  // Detener el escáner
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error al detener escáner:', err);
      }
      html5QrCodeRef.current = null;
      setScanning(false);
    }
  };

  // Cargar lista de cámaras disponibles al abrir
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            setCameras(devices);
            const defaultCam = devices[devices.length - 1].id;
            setSelectedCameraId(defaultCam);
            setTimeout(() => {
              startScanner(defaultCam);
            }, 300);
          } else {
            setErrorMsg('No se detectaron cámaras en este dispositivo. Puede subir un archivo de imagen con el QR.');
          }
        })
        .catch((err) => {
          console.warn('Permisos de cámara denegados o no disponibles:', err);
          setErrorMsg('No se pudo acceder a las cámaras. Verifique los permisos o use la pestaña "Subir Foto QR".');
        });
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, activeTab]);

  // Limpiar al cerrar modal
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setScannedInsumo(null);
      setErrorMsg('');
      setManualCode('');
      setShowSuccessAlert(false);
      setSuccessExiting(false);
      setUploadedImagePreview(null);
      setIsScanningImage(false);
    }
  }, [isOpen]);

  // Precargar voces del navegador
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  // Manejar cambio de archivo de imagen con animación láser
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    const previewUrl = URL.createObjectURL(file);
    setUploadedImagePreview(previewUrl);
    setIsScanningImage(true);

    try {
      const html5QrCode = new Html5Qrcode('qr-file-dummy-container', { verbose: false });
      const decodePromise = html5QrCode.scanFile(file, true);
      const delayPromise = new Promise((resolve) => setTimeout(resolve, 1400));

      const [decodedText] = await Promise.all([decodePromise, delayPromise]);
      setIsScanningImage(false);
      handleScanSuccess(decodedText);
    } catch (err) {
      setIsScanningImage(false);
      setErrorMsg('No se pudo detectar ningún código QR en la imagen seleccionada. Verifique la nitidez de la foto.');
    }
  };

  // Manejar envío de código manual
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScanSuccess(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <style>{`
        @keyframes qrModalLandscapeIn {
          from { opacity: 0; transform: scale(0.94) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes liveLaserSweep {
          0% { top: 4%; opacity: 0.85; }
          50% { top: 92%; opacity: 1; }
          100% { top: 4%; opacity: 0.85; }
        }
        @keyframes laserGlow {
          0%, 100% { filter: drop-shadow(0 0 8px #06b6d4) drop-shadow(0 0 16px #3b82f6); }
          50% { filter: drop-shadow(0 0 14px #10b981) drop-shadow(0 0 24px #06b6d4); }
        }
        @keyframes scanTextPulse {
          0%, 100% { opacity: 0.75; }
          50% { opacity: 1; }
        }
        @keyframes hudBoxPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); border-color: rgba(56, 189, 248, 0.6); }
          50% { transform: translate(-50%, -50%) scale(1.03); border-color: rgba(16, 185, 129, 0.8); }
        }
        .qr-land-close:hover {
          background: rgba(244, 63, 94, 0.18) !important;
          border-color: rgba(244, 63, 94, 0.45) !important;
          color: #f87171 !important;
          transform: rotate(90deg);
        }
        .qr-nav-tab {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .qr-nav-tab:hover:not(.active) {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.12);
        }
        .qr-input-manual:focus {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25) !important;
        }
        @media (max-width: 880px) {
          .qr-horizontal-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
      `}</style>

      <div
        className="modal-content"
        style={{
          maxWidth: '1000px',
          width: '95vw',
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: '34px 40px',
          borderRadius: '28px',
          background: 'linear-gradient(150deg, rgba(15, 23, 42, 0.98), rgba(9, 14, 28, 0.99))',
          border: '1px solid rgba(59, 130, 246, 0.32)',
          boxShadow: '0 40px 100px rgba(0, 0, 0, 0.8), 0 0 70px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          animation: 'qrModalLandscapeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
      >
        {/* ── Encabezado Superior Horizontal ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '18px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Ícono de Cámara Perfectamente Centrado */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(139, 92, 246, 0.25))',
              border: '1px solid rgba(59, 130, 246, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.45rem',
              lineHeight: 1,
              flexShrink: 0
            }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📷</span>
            </div>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
                {isEditMode ? 'Escanear QR para Editar Insumo' : 'Lector de Código QR de Insumos'}
              </h2>
              <span style={{ fontSize: '0.86rem', color: 'rgba(148, 163, 184, 0.85)', marginTop: '2px', display: 'block' }}>
                {isEditMode
                  ? 'Escaneá el código QR del insumo para abrir de forma automática su formulario de edición'
                  : 'Escaneá el QR o ingresá el código para abrir directamente el formulario de operaciones'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="qr-land-close"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'rgba(255, 255, 255, 0.65)',
              fontSize: '1.2rem',
              cursor: 'pointer',
              borderRadius: '14px',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Alerta de Error */}
        {errorMsg && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.45)',
            color: '#f87171',
            padding: '12px 18px',
            borderRadius: '14px',
            fontSize: '0.86rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>⚠️</span> {errorMsg}
          </div>
        )}

        {/* ── Alerta Premium Animada de Escaneo Exitoso ── */}
        {showSuccessAlert && scannedInsumo && (
          <>
            <style>{`
              @keyframes successOverlayIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes successOverlayOut {
                from { opacity: 1; }
                to { opacity: 0; }
              }
              @keyframes successCardIn {
                from { opacity: 0; transform: scale(0.7) translateY(30px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
              @keyframes successCardOut {
                from { opacity: 1; transform: scale(1) translateY(0); }
                to { opacity: 0; transform: scale(0.85) translateY(-20px); }
              }
              @keyframes checkDraw {
                0% { stroke-dashoffset: 48; }
                100% { stroke-dashoffset: 0; }
              }
              @keyframes successRingPulse1 {
                0% { transform: scale(0.5); opacity: 0.8; }
                100% { transform: scale(2.2); opacity: 0; }
              }
              @keyframes successRingPulse2 {
                0% { transform: scale(0.5); opacity: 0.6; }
                100% { transform: scale(2.8); opacity: 0; }
              }
              @keyframes successRingPulse3 {
                0% { transform: scale(0.5); opacity: 0.4; }
                100% { transform: scale(3.4); opacity: 0; }
              }
              @keyframes successTextSlideUp {
                from { opacity: 0; transform: translateY(16px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes successShimmer {
                0% { background-position: -300% 0; }
                100% { background-position: 300% 0; }
              }
            `}</style>
            <div style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.82)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              animation: successExiting ? 'successOverlayOut 0.5s ease-in forwards' : 'successOverlayIn 0.3s ease-out'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px',
                padding: '48px 40px',
                maxWidth: '440px',
                width: '90vw',
                textAlign: 'center',
                animation: successExiting ? 'successCardOut 0.5s ease-in forwards' : 'successCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #34d399', animation: 'successRingPulse1 1.5s ease-out infinite' }} />
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #34d399', animation: 'successRingPulse2 1.5s ease-out 0.3s infinite' }} />
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid #34d399', animation: 'successRingPulse3 1.5s ease-out 0.6s infinite' }} />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #059669, #34d399)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(52, 211, 153, 0.5), 0 0 60px rgba(52, 211, 153, 0.2)'
                  }}>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <path
                        d="M12 25 L20 33 L36 16"
                        stroke="white"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          strokeDasharray: 48,
                          strokeDashoffset: 48,
                          animation: 'checkDraw 0.6s ease-out 0.3s forwards'
                        }}
                      />
                    </svg>
                  </div>
                </div>

                <div style={{ animation: 'successTextSlideUp 0.5s ease-out 0.4s both' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
                    ¡Código Escaneado Correctamente!
                  </h2>
                  <p style={{ fontSize: '0.92rem', color: 'rgba(148, 163, 184, 0.8)', margin: 0 }}>
                    El insumo ha sido identificado exitosamente
                  </p>
                </div>

                <div style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.1), rgba(16, 185, 129, 0.06))',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  textAlign: 'left',
                  animation: 'successTextSlideUp 0.5s ease-out 0.6s both'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{
                      background: 'rgba(52, 211, 153, 0.2)',
                      border: '1px solid rgba(52, 211, 153, 0.4)',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#34d399',
                      letterSpacing: '0.04em'
                    }}>
                      #{scannedInsumo.numero || scannedInsumo.id}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                    {scannedInsumo.insumo}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'rgba(148, 163, 184, 0.7)' }}>
                    {scannedInsumo.presentacion} • {scannedInsumo.tamanoPresentacion}
                    <span style={{ margin: '0 8px', color: 'rgba(100, 116, 139, 0.4)' }}>|</span>
                    Stock: <strong style={{ color: '#34d399' }}>{scannedInsumo.stock ?? 0}</strong>
                  </div>
                </div>

                <div style={{ width: '100%', animation: 'successTextSlideUp 0.5s ease-out 0.8s both' }}>
                  <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(52, 211, 153, 0.15)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      borderRadius: '2px',
                      background: 'linear-gradient(90deg, #059669, #34d399, #6ee7b7)',
                      backgroundSize: '300% 100%',
                      animation: 'successShimmer 1.5s linear infinite',
                      width: '100%'
                    }} />
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'rgba(52, 211, 153, 0.7)', marginTop: '8px', fontWeight: 600 }}>
                    {isEditMode ? 'Abriendo formulario de edición de insumo...' : 'Abriendo formulario de operación...'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Grid Horizontal Principal (2 Columnas: Navegación Izquierda + Visor/Acción Derecha) ── */}
        <div className="qr-horizontal-grid" style={{ display: 'grid', gridTemplateColumns: '310px 1fr', gap: '30px', alignItems: 'start' }}>
          
          {/* ════ COLUMNA IZQUIERDA: Selector de Métodos & Consejos ════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(148, 163, 184, 0.7)', marginBottom: '2px' }}>
                Método de Detección
              </div>

              {/* Botón Modo Cámara */}
              <button
                onClick={() => {
                  stopScanner();
                  setActiveTab('camera');
                }}
                className={`qr-nav-tab ${activeTab === 'camera' ? 'active' : ''}`}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  border: activeTab === 'camera' ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: activeTab === 'camera' ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.25), rgba(56, 189, 248, 0.15))' : 'rgba(15, 23, 42, 0.7)',
                  color: activeTab === 'camera' ? '#38bdf8' : 'rgba(255, 255, 255, 0.85)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: activeTab === 'camera' ? '0 4px 20px rgba(56, 189, 248, 0.2)' : 'none'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: activeTab === 'camera' ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  color: '#fff',
                  flexShrink: 0
                }}>
                  📹
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Cámara en Vivo</div>
                  <div style={{ fontSize: '0.74rem', color: 'rgba(148, 163, 184, 0.7)', marginTop: '2px' }}>Escaneo láser en tiempo real</div>
                </div>
              </button>

              {/* Botón Modo Subir Foto */}
              <button
                onClick={() => {
                  stopScanner();
                  setActiveTab('file');
                }}
                className={`qr-nav-tab ${activeTab === 'file' ? 'active' : ''}`}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  border: activeTab === 'file' ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: activeTab === 'file' ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.25), rgba(56, 189, 248, 0.15))' : 'rgba(15, 23, 42, 0.7)',
                  color: activeTab === 'file' ? '#38bdf8' : 'rgba(255, 255, 255, 0.85)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: activeTab === 'file' ? '0 4px 20px rgba(56, 189, 248, 0.2)' : 'none'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: activeTab === 'file' ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  color: '#fff',
                  flexShrink: 0
                }}>
                  📁
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Subir Foto QR</div>
                  <div style={{ fontSize: '0.74rem', color: 'rgba(148, 163, 184, 0.7)', marginTop: '2px' }}>Desde archivo JPG, PNG o WEBP</div>
                </div>
              </button>

              {/* Botón Modo Código */}
              <button
                onClick={() => {
                  stopScanner();
                  setActiveTab('manual');
                }}
                className={`qr-nav-tab ${activeTab === 'manual' ? 'active' : ''}`}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  border: activeTab === 'manual' ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: activeTab === 'manual' ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.25), rgba(56, 189, 248, 0.15))' : 'rgba(15, 23, 42, 0.7)',
                  color: activeTab === 'manual' ? '#38bdf8' : 'rgba(255, 255, 255, 0.85)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: activeTab === 'manual' ? '0 4px 20px rgba(56, 189, 248, 0.2)' : 'none'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: activeTab === 'manual' ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  color: '#fff',
                  flexShrink: 0
                }}>
                  🏷️
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Código del Insumo</div>
                  <div style={{ fontSize: '0.74rem', color: 'rgba(148, 163, 184, 0.7)', marginTop: '2px' }}>Búsqueda directa por número o ID</div>
                </div>
              </button>
            </div>

            {/* Caja de Consejos */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              padding: '14px 16px',
              fontSize: '0.78rem',
              color: 'rgba(148, 163, 184, 0.85)',
              lineHeight: '1.45'
            }}>
              <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💡</span> Guía de Uso
              </div>
              {activeTab === 'camera' && 'Mantené el QR a 25-30 cm de la cámara con buena luz. El haz láser detectará automáticamente el insumo.'}
              {activeTab === 'file' && 'Seleccioná una imagen nítida tomada con tu celular o escáner para análisis por láser.'}
              {activeTab === 'manual' && 'Ingresá el número de código (ej. 1, #1 o INS-QR-...) para abrir inmediatamente el formulario.'}
            </div>

            {/* Botón de Cerrar */}
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '14px',
                fontSize: '0.88rem',
                fontWeight: 600,
                marginTop: 'auto'
              }}
            >
              Cerrar Lector
            </button>
          </div>

          {/* ════ COLUMNA DERECHA: Visor Principal de Escaneo ════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* ── MODO 1: Cámara en Vivo con Animación Láser Activa ── */}
            {activeTab === 'camera' && (
              <div>
                {cameras.length > 1 && (
                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Cámara:</label>
                    <select
                      value={selectedCameraId}
                      onChange={(e) => {
                        setSelectedCameraId(e.target.value);
                        startScanner(e.target.value);
                      }}
                      className="select-field"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.82rem',
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(59, 130, 246, 0.35)',
                        color: '#fff'
                      }}
                    >
                      {cameras.map((cam) => (
                        <option key={cam.id} value={cam.id}>
                          {cam.label || `Cámara ${cam.id.substring(0, 5)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    minHeight: '340px',
                    maxHeight: '420px',
                    background: '#020617',
                    borderRadius: '22px',
                    overflow: 'hidden',
                    border: '2px solid rgba(56, 189, 248, 0.45)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 35px rgba(56, 189, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {/* Elemento de renderizado html5-qrcode */}
                  <div id={scannerContainerId} style={{ width: '100%', height: '100%' }}></div>

                  {/* Overlay con Animación Láser de Escaneo Continuo en Vivo */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.08) 0%, rgba(2, 6, 23, 0.3) 100%)',
                    zIndex: 2
                  }}>
                    {/* Línea Láser Animada */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '4%',
                        right: '4%',
                        height: '3px',
                        background: 'linear-gradient(90deg, transparent 0%, #06b6d4 15%, #ffffff 50%, #10b981 85%, transparent 100%)',
                        boxShadow: '0 0 14px #06b6d4, 0 0 28px #10b981, 0 0 40px #38bdf8',
                        animation: 'liveLaserSweep 2s ease-in-out infinite, laserGlow 2s ease-in-out infinite'
                      }}
                    />

                    {/* Retícula de Enfoque Central */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '220px',
                      height: '220px',
                      border: '2px dashed rgba(56, 189, 248, 0.6)',
                      borderRadius: '16px',
                      animation: 'hudBoxPulse 2.5s ease-in-out infinite'
                    }}>
                      <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '20px', height: '20px', borderTop: '4px solid #38bdf8', borderLeft: '4px solid #38bdf8', borderRadius: '4px 0 0 0' }} />
                      <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '20px', height: '20px', borderTop: '4px solid #38bdf8', borderRight: '4px solid #38bdf8', borderRadius: '0 4px 0 0' }} />
                      <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #38bdf8', borderLeft: '4px solid #38bdf8', borderRadius: '0 0 0 4px' }} />
                      <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #38bdf8', borderRight: '4px solid #38bdf8', borderRadius: '0 0 4px 0' }} />
                    </div>

                    {/* Badge Indicador de Escáner Activo */}
                    <div style={{
                      position: 'absolute',
                      bottom: '16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(15, 23, 42, 0.92)',
                      border: '1px solid rgba(56, 189, 248, 0.5)',
                      borderRadius: '24px',
                      padding: '6px 16px',
                      color: '#38bdf8',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
                      animation: 'scanTextPulse 1.2s ease-in-out infinite',
                      whiteSpace: 'nowrap'
                    }}>
                      <span style={{ fontSize: '0.95rem' }}>⚡</span> ESCANEANDO EN TIEMPO REAL
                    </div>
                  </div>

                  {loadingMatch && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px', zIndex: 5 }}>
                      <div style={{ fontSize: '2rem' }}>⏳</div>
                      <div style={{ color: '#fff', fontSize: '0.96rem', fontWeight: 700 }}>Identificando Insumo...</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── MODO 2: Subir Foto QR ── */}
            {activeTab === 'file' && (
              <div>
                {uploadedImagePreview ? (
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    borderRadius: '22px',
                    overflow: 'hidden',
                    border: '2px solid rgba(56, 189, 248, 0.5)',
                    background: '#020617',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 35px rgba(56, 189, 248, 0.2)'
                  }}>
                    <img
                      src={uploadedImagePreview}
                      alt="QR Subido"
                      style={{
                        width: '100%',
                        maxHeight: '340px',
                        objectFit: 'contain',
                        display: 'block',
                        margin: '0 auto',
                        opacity: isScanningImage ? 0.75 : 1,
                        filter: isScanningImage ? 'contrast(1.1) brightness(0.9)' : 'none',
                        transition: 'all 0.3s ease'
                      }}
                    />

                    {/* Animación Láser de Escaneo */}
                    {isScanningImage && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        background: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.15) 0%, rgba(2, 6, 23, 0.4) 100%)'
                      }}>
                        <div
                          style={{
                            position: 'absolute',
                            left: '4%',
                            right: '4%',
                            height: '4px',
                            background: 'linear-gradient(90deg, transparent 0%, #06b6d4 15%, #ffffff 50%, #10b981 85%, transparent 100%)',
                            boxShadow: '0 0 15px #06b6d4, 0 0 30px #10b981, 0 0 45px #38bdf8',
                            animation: 'liveLaserSweep 1.6s ease-in-out infinite, laserGlow 1.6s ease-in-out infinite'
                          }}
                        />
                        <div style={{ position: 'absolute', top: '16px', left: '16px', width: '28px', height: '28px', borderTop: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8' }} />
                        <div style={{ position: 'absolute', top: '16px', right: '16px', width: '28px', height: '28px', borderTop: '3px solid #38bdf8', borderRight: '3px solid #38bdf8' }} />
                        <div style={{ position: 'absolute', bottom: '16px', left: '16px', width: '28px', height: '28px', borderBottom: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8' }} />
                        <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '28px', height: '28px', borderBottom: '3px solid #38bdf8', borderRight: '3px solid #38bdf8' }} />

                        <div style={{
                          position: 'absolute',
                          bottom: '20px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'rgba(15, 23, 42, 0.95)',
                          border: '1px solid rgba(56, 189, 248, 0.5)',
                          borderRadius: '24px',
                          padding: '8px 20px',
                          color: '#38bdf8',
                          fontSize: '0.86rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.6)',
                          animation: 'scanTextPulse 1s ease-in-out infinite'
                        }}>
                          <span style={{ fontSize: '1.1rem' }}>⚡</span> Analizando matriz QR...
                        </div>
                      </div>
                    )}

                    {!isScanningImage && (
                      <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.9)', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '8px 18px', fontSize: '0.86rem', borderRadius: '10px' }}
                          onClick={() => {
                            setUploadedImagePreview(null);
                            setErrorMsg('');
                            document.getElementById('qr-file-input')?.click();
                          }}
                        >
                          📁 Elegir otra fotografía
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      border: '2px dashed rgba(56, 189, 248, 0.45)',
                      borderRadius: '22px',
                      padding: '48px 24px',
                      background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.7))',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.25s ease'
                    }}
                    onClick={() => document.getElementById('qr-file-input')?.click()}
                  >
                    <div style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(59, 130, 246, 0.15))',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.2rem',
                      margin: '0 auto 16px auto',
                      boxShadow: '0 8px 24px rgba(56, 189, 248, 0.15)'
                    }}>
                      🖼️
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                      Seleccionar fotografía con el Código QR
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: 'rgba(148, 163, 184, 0.8)', maxWidth: '420px', margin: '0 auto 20px auto' }}>
                      Formatos compatibles: JPG, PNG, WEBP de alta nitidez
                    </p>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        padding: '12px 28px',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                        color: '#fff',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(56, 189, 248, 0.35)'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById('qr-file-input')?.click();
                      }}
                    >
                      Buscar Archivo de Imagen
                    </button>
                  </div>
                )}

                <input
                  id="qr-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <div id="qr-file-dummy-container" style={{ display: 'none' }}></div>
              </div>
            )}

            {/* ── MODO 3: Entrada por Código ── */}
            {activeTab === 'manual' && (
              <form
                onSubmit={handleManualSubmit}
                style={{
                  background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.7))',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '22px',
                  padding: '36px 30px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px', display: 'block' }}>
                    Código del Insumo
                  </label>
                  <input
                    type="text"
                    className="input-field qr-input-manual"
                    placeholder="Ej. #1, 1 o INS-QR-..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    autoFocus
                    required
                    style={{
                      height: '52px',
                      borderRadius: '14px',
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(59, 130, 246, 0.35)',
                      color: '#fff',
                      fontSize: '1.1rem',
                      padding: '12px 20px',
                      fontWeight: 600
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'rgba(148, 163, 184, 0.75)', marginTop: '8px', display: 'block' }}>
                    💡 Ingrese el código numérico o identificador único del insumo para abrir su formulario.
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn"
                  disabled={!manualCode.trim() || loadingMatch}
                  style={{
                    width: '100%',
                    height: '50px',
                    borderRadius: '14px',
                    fontSize: '0.94rem',
                    fontWeight: 700,
                    background: !manualCode.trim() ? 'rgba(100, 116, 139, 0.4)' : 'linear-gradient(135deg, #0284c7, #38bdf8)',
                    color: '#fff',
                    border: 'none',
                    cursor: !manualCode.trim() ? 'not-allowed' : 'pointer',
                    boxShadow: !manualCode.trim() ? 'none' : '0 4px 20px rgba(56, 189, 248, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {loadingMatch ? '🔍 Buscando Insumo...' : '🔍 Buscar Insumo y Abrir Operación'}
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
