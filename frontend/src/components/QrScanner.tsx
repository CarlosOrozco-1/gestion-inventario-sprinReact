import { useRef, useEffect, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { playQrSuccess } from '../utils/sound';

interface QrScannerProps {
  isOpen: boolean;
  onScan: (qrCode: string) => void;
  onClose: () => void;
}

export default function QrScanner({ isOpen, onScan, onClose }: QrScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const stoppedRef = useRef(false);
  const scannedRef = useRef(false);
  const pendingTimerRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Detiene la cámara de forma segura (evita "already under transition").
  const stopScanner = async () => {
    if (html5QrcodeRef.current && !stoppedRef.current) {
      stoppedRef.current = true;
      try {
        await html5QrcodeRef.current.stop();
        await html5QrcodeRef.current.clear();
      } catch (err) {
        console.warn('QR scanner teardown:', err);
      }
      html5QrcodeRef.current = null;
      setScanning(false);
    }
  };

  const scanHandler = (qrCode: string) => {
    // Previene múltiples disparos del mismo QR.
    if (scannedRef.current) return;
    scannedRef.current = true;
    // Feedback sonoro + transición de carga antes de abrir el resultado.
    playQrSuccess();
    setDetected(true);
    stopScanner();
    pendingTimerRef.current = window.setTimeout(() => {
      onScan(qrCode);
    }, 900);
  };

  // Arranca la cámara cuando se abre el escáner.
  useEffect(() => {
    if (!isOpen) return;

    const startScanner = async () => {
      if (!containerRef.current) return;
      const el = containerRef.current;

      try {
        scannedRef.current = false;
        stoppedRef.current = false;
        setDetected(false);
        setError(null);
        setManualMode(false);
        setManualCode('');
        // Espera un tick para asegurar que el contenedor esté montado.
        await new Promise((r) => setTimeout(r, 50));
        // La cámara solo existe en un contexto seguro (HTTPS o localhost).
        // Servida por HTTP en una IP de red local, el navegador no expone
        // navigator.mediaDevices y html5-qrcode lanza "Camera streaming not
        // supported by the browser". Se cae a la entrada manual.
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
          setError('Cámara no disponible');
          setManualMode(true);
          return;
        }
        // BarcodeDetector es el detector NATIVO del navegador (Android/Chrome).
        // Es el mismo motor que usa la app de camara del telefono, y detecta
        // QR pequenos que el decodificador en JavaScript no logra. Donde no
        // existe (iPhone, escritorio) la libreria cae sola a ZXing.
        const scanner = new Html5Qrcode('qr-reader', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          useBarCodeDetectorIfSupported: true,
        });
        html5QrcodeRef.current = scanner;
        await scanner.start(
          // Pedir 1080p: sin esto el movil entrega 480p y un QR pequeno se
          // queda sin pixeles suficientes por modulo para decodificarse.
          {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          // Sin qrbox: html5-qrcode solo analiza lo que cae DENTRO de esa caja,
          // y con 200x200 px un QR pequeno quedaba fuera del centro y no se
          // leia. fps alto para dar mas intentos por segundo.
          { fps: 20 },
          scanHandler,
          () => { /* errores de decodificación: ignorar */ }
        );
        setScanning(true);
      } catch (err) {
        console.error('Error starting QR scanner:', err);
        setError('No se pudo acceder a la cámara');
        setManualMode(true);
        // El escáner nunca llegó a arrancar: soltar la referencia evita que
        // el cleanup intente detener un scanner que no está corriendo.
        html5QrcodeRef.current = null;
        // Limpia el contenedor para no dejar un video roto.
        el.innerHTML = '';
        setScanning(false);
      }
    };

    startScanner();
    // Cleanup: detiene la cámara al cerrar o desmontar.
    return () => {
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
      }
      stopScanner();
    };
  }, [isOpen]);

  const handleClose = () => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    setDetected(false);
    stopScanner().finally(() => onClose());
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Escanear Código QR</h3>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label="Cerrar escáner"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {/* El contenedor permanece SIEMPRE montado para que html5-qrcode no
              pierda el elemento video mientras la cámara está activa. */}
          <div className="w-full aspect-video bg-slate-100 rounded-xl overflow-hidden relative">
            <div ref={containerRef} id="qr-reader" className="w-full h-full"></div>

            {error && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-600 p-4 text-center"
                title="La cámara del navegador solo está disponible en HTTPS o en localhost. Al entrar por HTTP a una IP de red local, el navegador la bloquea por seguridad. Puedes consultar el insumo escribiendo su código."
              >
                <p className="font-medium">{error}</p>
              </div>
            )}

            {detected && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-emerald-50/95 text-emerald-700">
                <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin"></div>
                <p className="font-semibold">ESCANEO EXITOSO</p>
                <p className="text-sm text-emerald-600">Cargando datos del insumo...</p>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <p
              className="text-sm text-slate-500 text-center"
              title="Apunta la cámara al código QR impreso en la etiqueta del insumo."
            >
              Apunta la cámara al código QR
            </p>

            {manualMode ? (
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const code = manualCode.trim();
                  if (!code) return;
                  onScan(code);
                }}
              >
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Código del insumo"
                  autoFocus
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Consultar
                </button>
              </form>
            ) : (
              <button
                onClick={() => setManualMode(true)}
                title="Escribe el código del insumo en lugar de usar la cámara."
                className="w-full text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                Ingresar código
              </button>
            )}

            <button
              onClick={handleClose}
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
