import { useRef, useEffect, useState } from 'react';
import QrScannerLib from 'qr-scanner';
import { playQrSuccess } from '../utils/sound';
import { btn, iconBtn } from '../utils/buttonStyles';

interface QrScannerProps {
  isOpen: boolean;
  onScan: (qrCode: string) => void;
  onClose: () => void;
}

export default function QrScanner({ isOpen, onScan, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScannerLib | null>(null);
  const stoppedRef = useRef(false);
  const scannedRef = useRef(false);
  const pendingTimerRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Detiene la cámara: destroy() libera el stream, los listeners y cierra el
  // motor de decodificación. Es síncrono, evita cerrado en cascada.
  const stopScanner = () => {
    if (scannerRef.current && !stoppedRef.current) {
      stoppedRef.current = true;
      try {
        scannerRef.current.destroy();
      } catch (err) {
        console.warn('QR scanner teardown:', err);
      }
      scannerRef.current = null;
      setScanning(false);
    }
  };

  // Arranca la cámara cuando se abre el escáner.
  useEffect(() => {
    if (!isOpen) return;

    const startScanner = async () => {
      if (!videoRef.current) return;

      try {
        scannedRef.current = false;
        stoppedRef.current = false;
        setDetected(false);
        setError(null);
        setManualMode(false);
        setManualCode('');
        // Espera un tick para asegurar que el video esté montado.
        await new Promise((r) => setTimeout(r, 50));
        // La cámara solo existe en un contexto seguro (HTTPS o localhost).
        // Servida por HTTP en una IP de red local, el navegador no expone
        // navigator.mediaDevices y qr-scanner no puede pedir permisos.
        // Se cae a la entrada manual.
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
          setError('Cámara no disponible');
          setManualMode(true);
          return;
        }
        // qr-scanner usa BarcodeDetector NATIVO (Chrome/Android, mismo motor
        // que la app de camara del telefono) y cae a un worker de ZXing donde
        // no existe (iPhone, escritorio). Los dos motores decodifican el
        // canvas que la libreria dibuja, por eso el scanRegion define la
        // resolucion real: el frame completo SIN downscale mantiene todos los
        // pixeles para codigos pequenos. Sin detector nativo se limita a 640px
        // para no saturar el worker con 1080p completo.
        const scanner = new QrScannerLib(
          videoRef.current,
          (result) => {
            // Previene múltiples disparos del mismo QR.
            if (scannedRef.current) return;
            scannedRef.current = true;
            // Feedback sonoro + transición de carga antes de abrir el resultado.
            playQrSuccess();
            setDetected(true);
            stopScanner();
            pendingTimerRef.current = window.setTimeout(() => {
              onScan(result.data);
            }, 900);
          },
          {
            preferredCamera: 'environment',
            maxScansPerSecond: 10,
            calculateScanRegion: (video) => {
              const frame = {
                x: 0,
                y: 0,
                width: video.videoWidth,
                height: video.videoHeight,
              };
              if ('BarcodeDetector' in window) return frame;
              return { ...frame, downScaledWidth: 640, downScaledHeight: 640 };
            },
            onDecodeError: () => { /* errores de decodificación: ignorar */ },
          }
        );
        scannerRef.current = scanner;
        await scanner.start();
        setScanning(true);
      } catch (err) {
        console.error('Error starting QR scanner:', err);
        if (scannerRef.current) {
          try {
            scannerRef.current.destroy();
          } catch {
            /* ya está cerrado */
          }
          scannerRef.current = null;
        }
        setError('No se pudo acceder a la cámara');
        setManualMode(true);
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
    stopScanner();
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Escanear Código QR</h3>
          <button
            onClick={handleClose}
            className={iconBtn('neutro', 'chico')}
            title="Cerrar escáner" aria-label="Cerrar escáner"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {/* El video permanece SIEMPRE montado mientras la cámara está activa;
              qr-scanner lo usa como superficie y aplica playsInline/muted. */}
          <div className="w-full aspect-video bg-slate-100 rounded-xl overflow-hidden relative">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted></video>

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
                  className={btn('primario', 'bloque')}
                >
                  Consultar
                </button>
              </form>
            ) : (
              <button
                onClick={() => setManualMode(true)}
                title="Escribe el código del insumo en lugar de usar la cámara."
                className={btn('fantasma', 'bloque')}
              >
                Ingresar código
              </button>
            )}

            <button
              onClick={handleClose}
              className={btn('neutro', 'bloque')}
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
