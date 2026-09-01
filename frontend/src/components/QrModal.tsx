import { useState, useCallback } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';

interface QrModalProps {
  isOpen: boolean;
  item: any;
  presentation: any;
  onClose: () => void;
}

/**
 * Modal de vista ampliada del código QR de una presentación.
 * Muestra el QR en grande como si fuera un cartel con el nombre del insumo
 * y su código. Ofrece dos acciones:
 *  - Descargar PNG: exporta el QR como imagen descargable.
 *  - Imprimir: abre una vista previa (cartel) e imprime.
 */
export default function QrModal({ isOpen, item, presentation, onClose }: QrModalProps) {
  const [qrCanvas, setQrCanvas] = useState<HTMLCanvasElement | null>(null);
  const [svgEl, setSvgEl] = useState<SVGSVGElement | null>(null);

  const handleDownloadPng = useCallback(() => {
    const canvas = qrCanvas;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-${item?.code ?? 'insumo'}-${presentation?.name ?? 'variante'}.png`;
    a.click();
  }, [qrCanvas, item, presentation]);

  const handlePrint = useCallback(() => {
    const svgString = svgEl ? svgEl.outerHTML : '';
    const name = item?.name ?? '';
    const code = item?.code ?? '';
    const pres = presentation?.name ?? '';
    const size = presentation?.size ? `(${presentation.size})` : '';

    const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>SIGES - QR ${name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .cartel { border: 2px solid #0f172a; border-radius: 12px; padding: 28px 32px; text-align: center; max-width: 320px; }
    .logo { font-weight: 900; letter-spacing: 4px; color: #1d4ed8; margin-bottom: 12px; }
    .nombre { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
    .detalle { font-size: 13px; color: #475569; margin-bottom: 16px; }
    .qr { display: flex; justify-content: center; }
  </style>
</head>
<body>
  <div class="cartel">
    <div class="logo">SIGES</div>
    <div class="nombre">${name}</div>
    <div class="detalle">Cód.: ${code} · ${pres} ${size}</div>
    <div class="qr">${svgString}</div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(content);
    win.document.close();
    // Espera a que el navegador renderice el SVG antes de imprimir.
    win.onload = function () {
      win.focus();
      win.print();
    };
    // Fallback por si onload no se dispara.
    setTimeout(() => { win.focus(); win.print(); }, 600);
  }, [svgEl, item, presentation]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">Código QR</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Vistazo previo del cartel */}
        <div className="p-6 flex justify-center">
          <div className="border border-slate-300 rounded-xl p-6 flex flex-col items-center gap-3 bg-white shadow-sm max-w-[260px]">
            <span className="text-xs font-black tracking-widest text-brand-600">SIGES</span>
            <span className="text-center font-bold text-slate-800 line-clamp-2">{item?.name}</span>
            <span className="text-xs text-slate-500 text-center">
              Cód.: {item?.code} · {presentation?.name}
              {presentation?.size ? ` (${presentation.size})` : ''}
            </span>
            {/* El QR real se muestra desde qrcode.react (canvas para PNG) */}
            <QRCodeCanvas
              value={presentation?.qrCode ?? ''}
              size={200}
              level="M"
              includeMargin
              ref={setQrCanvas}
            />
            {/* SVG oculto usado para imprimir (se serializa a string) */}
            <QRCodeSVG
              value={presentation?.qrCode ?? ''}
              size={260}
              level="M"
              includeMargin
              className="hidden"
              ref={(node: SVGSVGElement | null) => setSvgEl(node)}
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          <button
            onClick={handleDownloadPng}
            className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descargar PNG
          </button>
          <button
            onClick={handlePrint}
            className="w-full inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2h2z" />
            </svg>
            Imprimir cartel
          </button>
          <button
            onClick={onClose}
            className="w-full inline-flex items-center justify-center px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
