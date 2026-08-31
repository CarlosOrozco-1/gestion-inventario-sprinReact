import { useRef, useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

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
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

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
    stopScanner();
    onScan(qrCode);
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
        // Espera un tick para asegurar que el contenedor esté montado.
        await new Promise((r) => setTimeout(r, 50));
        const scanner = new Html5Qrcode('qr-reader');
        html5QrcodeRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 200, height: 200 } },
          scanHandler,
          () => { /* errores de decodificación: ignorar */ }
        );
        setScanning(true);
      } catch (err) {
        console.error('Error starting QR scanner:', err);
        setError('No se pudo acceder a la cámara. Verifica los permisos.');
        // Limpia el contenedor para no dejar un video roto.
        el.innerHTML = '';
        setScanning(false);
      }
    };

    startScanner();
    // Cleanup: detiene la cámara al cerrar o desmontar.
    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const handleClose = () => {
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
          <div
            ref={containerRef}
            id="qr-reader"
            className="w-full aspect-video bg-slate-100 rounded-xl overflow-hidden relative"
          >
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-600 p-4 text-center">
                <p className="font-medium">{error}</p>
                <p className="text-sm mt-1">Ingresa el código manualmente o intenta de nuevo.</p>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-500 text-center">
              Apunta la cámara al código QR del insumo
            </p>

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
