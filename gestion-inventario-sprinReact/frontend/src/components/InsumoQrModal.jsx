import React, { useRef, useState } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';

export default function InsumoQrModal({ isOpen, onClose, insumo, onOpenMovimiento }) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef(null);

  if (!isOpen || !insumo) return null;

  // El payload del QR contiene el código único seguro del insumo
  const qrValue = insumo.codigoQr || `INS-QR-${insumo.numero || insumo.id}-${insumo.id}`;
  const stock = insumo.stock ?? 0;
  const entrada = insumo.entrada ?? 0;

  // Determinar el estado del stock
  const getStockStatus = () => {
    if (stock <= 0) return { label: 'Agotado', color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)', icon: '🔴' };
    if (stock <= 10) return { label: 'Stock Bajo', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)', icon: '🟡' };
    return { label: 'Disponible', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)', icon: '🟢' };
  };
  const stockStatus = getStockStatus();

  // Formatear fechas
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateStr; }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPng = () => {
    const canvas = document.getElementById(`qr-canvas-${insumo.id}`);
    if (!canvas) return;
    const pngUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `QR_Insumo_${insumo.numero || ''}_${insumo.insumo.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const canvas = document.getElementById(`qr-canvas-${insumo.id}`);
    const qrDataUrl = canvas ? canvas.toDataURL('image/png') : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta QR - ${insumo.insumo}</title>
          <style>
            @page {
              size: auto;
              margin: 10mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 20px;
              margin: 0;
              background: #fff;
              color: #111;
            }
            .label-card {
              border: 2px solid #000;
              border-radius: 8px;
              padding: 16px;
              width: 320px;
              text-align: center;
              page-break-inside: avoid;
            }
            .title {
              font-size: 16px;
              font-weight: 800;
              margin-bottom: 4px;
              text-transform: uppercase;
            }
            .badge {
              display: inline-block;
              background: #000;
              color: #fff;
              font-size: 12px;
              font-weight: bold;
              padding: 2px 8px;
              border-radius: 4px;
              margin-bottom: 8px;
            }
            .detail {
              font-size: 12px;
              margin: 2px 0;
              color: #333;
            }
            .qr-img {
              margin: 12px auto;
              display: block;
              width: 170px;
              height: 170px;
            }
            .code-text {
              font-family: monospace;
              font-size: 11px;
              letter-spacing: 0.5px;
              color: #555;
              border-top: 1px dashed #999;
              padding-top: 6px;
              margin-top: 6px;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <span class="badge">CÓDIGO #${insumo.numero || insumo.id}</span>
            <div class="title">${insumo.insumo}</div>
            <div class="detail"><strong>Presentación:</strong> ${insumo.presentacion || 'N/A'}</div>
            <div class="detail"><strong>Tamaño:</strong> ${insumo.tamanoPresentacion || 'N/A'}</div>
            ${qrDataUrl ? `<img src="${qrDataUrl}" class="qr-img" />` : ''}
            <div class="code-text">${qrValue}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ── Estilos inline del modal premium ──
  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    animation: 'qrModalOverlayIn 0.3s ease-out'
  };

  const modalStyle = {
    background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.97), rgba(10, 15, 30, 0.99))',
    border: '1px solid rgba(59, 130, 246, 0.25)',
    borderRadius: '24px',
    padding: '0',
    maxWidth: '720px',
    width: '95vw',
    maxHeight: '92vh',
    overflowY: 'auto',
    position: 'relative',
    boxShadow: '0 32px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
    animation: 'qrModalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
  };

  const headerStyle = {
    padding: '28px 32px 0 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  };

  const closeBtnStyle = {
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '1.1rem',
    cursor: 'pointer',
    borderRadius: '12px',
    width: '38px',
    height: '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    flexShrink: 0
  };

  const bodyStyle = {
    padding: '24px 32px 28px 32px'
  };

  const twoColumnStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '28px',
    alignItems: 'start'
  };

  const qrContainerOuterStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  };

  const qrFrameStyle = {
    background: '#ffffff',
    padding: '20px',
    borderRadius: '20px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.2)',
    border: '3px solid rgba(59, 130, 246, 0.35)',
    position: 'relative',
    overflow: 'hidden'
  };

  const infoCardStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  };

  const fieldGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  };

  const fieldLabelStyle = {
    fontSize: '0.68rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'rgba(148, 163, 184, 0.7)'
  };

  const fieldValueStyle = {
    fontSize: '0.92rem',
    fontWeight: 600,
    color: '#e2e8f0'
  };

  const codeBarStyle = {
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    marginTop: '4px'
  };

  const actionsGridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '20px'
  };

  const actionBtnBaseStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '0.84rem',
    fontWeight: 600,
    padding: '12px 16px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none'
  };

  return (
    <div style={overlayStyle}>
      <style>{`
        @keyframes qrModalOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes qrModalSlideIn {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes qrShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes qrPulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.15); }
          50% { box-shadow: 0 0 35px rgba(59, 130, 246, 0.35); }
        }
        @keyframes qrBadgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        .qr-modal-close:hover {
          background: rgba(244, 63, 94, 0.15) !important;
          border-color: rgba(244, 63, 94, 0.4) !important;
          color: #f87171 !important;
          transform: rotate(90deg);
        }
        .qr-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
        }
        .qr-copy-btn:hover {
          background: rgba(59, 130, 246, 0.2) !important;
          border-color: rgba(59, 130, 246, 0.5) !important;
        }
        @media (max-width: 640px) {
          .qr-modal-twocol {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={modalStyle}>
        {/* ── Header ── */}
        <div style={headerStyle}>
          <div style={{ flex: 1 }}>
            {/* Badge de código */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.12))',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '6px 14px',
              borderRadius: '24px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#60a5fa',
              letterSpacing: '0.04em',
              marginBottom: '12px',
              animation: 'qrBadgePulse 3s ease-in-out infinite'
            }}>
              <span style={{ fontSize: '0.9rem' }}>🏷️</span> CÓDIGO #{insumo.numero || insumo.id}
            </div>

            {/* Nombre del insumo */}
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 6px 0',
              lineHeight: 1.2,
              letterSpacing: '-0.01em'
            }}>
              {insumo.insumo}
            </h2>

            {/* Subtítulo */}
            <p style={{
              fontSize: '0.88rem',
              color: 'rgba(148, 163, 184, 0.8)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              {insumo.presentacion}
              <span style={{ color: 'rgba(100, 116, 139, 0.5)' }}>•</span>
              {insumo.tamanoPresentacion}
            </p>
          </div>

          <button
            onClick={onClose}
            className="qr-modal-close"
            style={closeBtnStyle}
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* ── Separador con gradiente ── */}
        <div style={{
          height: '1px',
          margin: '20px 32px 0 32px',
          background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.2), transparent)'
        }} />

        {/* ── Body ── */}
        <div style={bodyStyle}>
          {/* Layout dos columnas */}
          <div className="qr-modal-twocol" style={twoColumnStyle}>
            {/* ── Columna izquierda: QR ── */}
            <div style={qrContainerOuterStyle}>
              {/* Marco del QR con glow */}
              <div style={{
                ...qrFrameStyle,
                animation: 'qrPulseGlow 4s ease-in-out infinite'
              }}>
                <QRCodeSVG
                  value={qrValue}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
                {/* Canvas oculto para exportación PNG e impresión */}
                <div style={{ display: 'none' }}>
                  <QRCodeCanvas
                    id={`qr-canvas-${insumo.id}`}
                    value={qrValue}
                    size={512}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              {/* Barra de código QR con botón copiar */}
              <div style={codeBarStyle}>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(148, 163, 184, 0.6)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '2px' }}>
                    Identificador QR Único
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontSize: '0.78rem',
                    color: '#60a5fa',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {qrValue}
                  </div>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="qr-copy-btn"
                  style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: copied ? '#34d399' : '#60a5fa',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                    whiteSpace: 'nowrap'
                  }}
                  title="Copiar código"
                >
                  {copied ? '✅ Copiado' : '📋 Copiar'}
                </button>
              </div>
            </div>

            {/* ── Columna derecha: Información detallada ── */}
            <div style={infoCardStyle}>
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'rgba(96, 165, 250, 0.7)',
                marginBottom: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>📋</span> Información del Insumo
              </div>

              {/* Estado del Stock - Destacado */}
              <div style={{
                background: stockStatus.bg,
                border: `1px solid ${stockStatus.color}30`,
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(148, 163, 184, 0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: stockStatus.color, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    {stockStatus.icon} {stockStatus.label}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(148, 163, 184, 0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock Actual</div>
                  <div style={{
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    color: stockStatus.color,
                    lineHeight: 1,
                    marginTop: '2px'
                  }}>
                    {stock}
                  </div>
                </div>
              </div>

              {/* Grid de campos */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={fieldGroupStyle}>
                  <span style={fieldLabelStyle}>Presentación</span>
                  <span style={fieldValueStyle}>{insumo.presentacion || 'N/A'}</span>
                </div>
                <div style={fieldGroupStyle}>
                  <span style={fieldLabelStyle}>Tamaño</span>
                  <span style={fieldValueStyle}>{insumo.tamanoPresentacion || 'N/A'}</span>
                </div>
                <div style={fieldGroupStyle}>
                  <span style={fieldLabelStyle}>Entradas Totales</span>
                  <span style={{ ...fieldValueStyle, color: '#34d399' }}>{entrada}</span>
                </div>
                <div style={fieldGroupStyle}>
                  <span style={fieldLabelStyle}>ID Sistema</span>
                  <span style={{ ...fieldValueStyle, fontFamily: 'monospace', color: '#94a3b8' }}>#{insumo.id}</span>
                </div>
              </div>

              {/* Fechas */}
              <div style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                paddingTop: '12px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
              }}>
                <div style={fieldGroupStyle}>
                  <span style={fieldLabelStyle}>📅 Registrado</span>
                  <span style={{ ...fieldValueStyle, fontSize: '0.78rem', color: '#94a3b8' }}>{formatDate(insumo.createdAt)}</span>
                </div>
                <div style={fieldGroupStyle}>
                  <span style={fieldLabelStyle}>🔄 Actualizado</span>
                  <span style={{ ...fieldValueStyle, fontSize: '0.78rem', color: '#94a3b8' }}>{formatDate(insumo.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Botones de acción ── */}
          <div style={actionsGridStyle}>
            <button
              onClick={handleDownloadPng}
              className="qr-action-btn"
              style={{
                ...actionBtnBaseStyle,
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.06))',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                color: '#60a5fa'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>📥</span> Descargar PNG
            </button>

            <button
              onClick={handlePrint}
              className="qr-action-btn"
              style={{
                ...actionBtnBaseStyle,
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(139, 92, 246, 0.06))',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                color: '#a78bfa'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>🖨️</span> Imprimir Etiqueta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
