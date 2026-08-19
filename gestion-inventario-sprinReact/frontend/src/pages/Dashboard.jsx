import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import InsumoModal from '../components/InsumoModal';
import DeleteInsumoModal from '../components/DeleteInsumoModal';
import MovimientoModal from '../components/MovimientoModal';
import InsumoQrModal from '../components/InsumoQrModal';
import QrScannerModal from '../components/QrScannerModal';
import InsumosModule from '../components/InsumosModule';
import MovimientosModule from '../components/MovimientosModule';
import UsuariosModule from '../components/UsuariosModule';
import AlertasModule from '../components/AlertasModule';
import BitacoraModule from '../components/BitacoraModule';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resumen');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isInsumoModalOpen, setIsInsumoModalOpen] = useState(false);
  const [insumoToEdit, setInsumoToEdit] = useState(null);
  const [insumoToDelete, setInsumoToDelete] = useState(null);
  const [selectedInsumoForMov, setSelectedInsumoForMov] = useState(null);
  const [selectedInsumoForQr, setSelectedInsumoForQr] = useState(null);
  const [qrScannerConfig, setQrScannerConfig] = useState({ isOpen: false, mode: 'movimiento' });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const openMobileSidebar = () => {
    setIsMobileSidebarOpen(true);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const fetchInsumos = async () => {
    setLoading(true);
    try {
      const response = await API.get('/insumos');
      setInsumos(response.data || []);
    } catch (err) {
      console.error("Error al obtener insumos de la base de datos:", err);
      setInsumos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  const totalInsumos = insumos.length;
  const enStockCount = insumos.filter((i) => (i.stock ?? 0) > 0).length;
  const sinStockCount = insumos.filter((i) => (i.stock ?? 0) === 0).length;

  const rawRol = typeof user?.rol === 'object' ? user?.rol?.nombre : user?.rol;
  const userRol = (rawRol || 'ADMIN').toString().toUpperCase().trim();
  const isAdmin = userRol === 'ADMIN';
  const isJefe = userRol === 'JEFE';
  const isAuxiliar = userRol === 'AUXILIAR';

  const handleOpenNewInsumoModal = () => {
    setInsumoToEdit(null);
    setIsInsumoModalOpen(true);
  };

  const handleOpenEditInsumoModal = (insumo) => {
    setInsumoToEdit(insumo);
    setIsInsumoModalOpen(true);
  };

  const accessShortcuts = [
    { tab: 'insumos', icon: '📦', title: 'Catálogo de Insumos', tooltip: 'Explorá la lista completa de artículos, consultá e imprimí códigos QR únicos.', show: true },
    { tab: 'movimientos', icon: '🔄', title: 'Movimientos de Stock', tooltip: 'Registrá entradas y salidas usando el lector de QR o selección directa.', show: true },
    { tab: 'usuarios', icon: '👥', title: 'Usuarios y Permisos', tooltip: 'Gestión de cuentas registradas en la base de datos y matriz de accesos.', show: isAdmin },
    { tab: 'alertas', icon: '🚨', title: 'Alertas de Stock', tooltip: 'Consultá artículos en nivel crítico y desabastecimiento.', show: isAdmin || isJefe },
    { tab: 'bitacora', icon: '📋', title: 'Bitácora de Cambios', tooltip: 'Registro obligatorio de todas las acciones y justificaciones.', show: isAdmin || isJefe }
  ];

  return (
    <div className="app-layout">
      {/* Sidebar Plegable del Lado Izquierdo con soporte móvil */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        isMobileOpen={isMobileSidebarOpen}
        closeMobileSidebar={closeMobileSidebar}
      />

      {/* Contenido Principal */}
      <div className="main-content">
        <Navbar
          toggleSidebar={toggleSidebar}
          openMobileSidebar={openMobileSidebar}
          isCollapsed={isSidebarCollapsed}
          activeTab={activeTab}
        />

        <main style={{ flex: 1, padding: '32px 28px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {/* Renderizado de Módulos */}
          {activeTab === 'resumen' && (
            <div className="module-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>📊 Resumen General del Sistema</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
                    Visión global del inventario de insumos y accesos directos
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button onClick={fetchInsumos} className="btn btn-secondary sharp-border" disabled={loading}>
                    {loading ? '⌛ Actualizando...' : '🔄 Actualizar Datos'}
                  </button>
                </div>
              </div>

              {/* Tarjetas de Estadísticas Responsive */}
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <div className="glass-card sharp-border" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Insumos</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-blue)', marginTop: '4px' }}>{totalInsumos}</div>
                </div>
                <div className="glass-card sharp-border" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, uppercase: true }}>Insumos con Stock</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '4px' }}>{enStockCount}</div>
                </div>
                <div className="glass-card sharp-border" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, uppercase: true }}>Sin Stock / Alerta</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-rose)', marginTop: '4px' }}>{sinStockCount}</div>
                </div>
              </div>

              {/* Acceso Rápido a Módulos según Rol */}
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Accesos Directos a Módulos</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px' }}>
                {accessShortcuts.filter((s) => s.show).map((s) => (
                  <div
                    key={s.tab}
                    onClick={() => setActiveTab(s.tab)}
                    className="glass-card sharp-border module-shortcut"
                    data-tooltip={s.tooltip}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveTab(s.tab);
                      }
                    }}
                  >
                    <div className="module-shortcut-icon">{s.icon}</div>
                    <h3 className="module-shortcut-title">{s.title}</h3>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'insumos' && (
            <InsumosModule
              insumos={insumos}
              loading={loading}
              fetchInsumos={fetchInsumos}
              onOpenNewInsumoModal={handleOpenNewInsumoModal}
              onEditInsumo={handleOpenEditInsumoModal}
              onDeleteInsumo={(item) => setInsumoToDelete(item)}
              onOpenMovimientoModal={(item) => setSelectedInsumoForMov(item)}
              onViewQr={(item) => setSelectedInsumoForQr(item)}
              onOpenScannerForEdit={() => setQrScannerConfig({ isOpen: true, mode: 'edicion' })}
              user={user}
            />
          )}

          {activeTab === 'movimientos' && (
            <MovimientosModule
              insumos={insumos}
              onOpenMovimientoModal={(item) => setSelectedInsumoForMov(item)}
              onOpenScanner={() => setQrScannerConfig({ isOpen: true, mode: 'movimiento' })}
            />
          )}

          {activeTab === 'usuarios' && isAdmin && (
            <UsuariosModule user={user} />
          )}

          {activeTab === 'alertas' && (isAdmin || isJefe) && (
            <AlertasModule insumos={insumos} />
          )}

          {activeTab === 'bitacora' && (isAdmin || isJefe) && (
            <BitacoraModule user={user} />
          )}
        </main>
      </div>

      {/* Modales */}
      <InsumoModal
        isOpen={isInsumoModalOpen}
        insumoToEdit={insumoToEdit}
        insumos={insumos}
        onClose={() => {
          setIsInsumoModalOpen(false);
          setInsumoToEdit(null);
        }}
        onSuccess={fetchInsumos}
      />

      <DeleteInsumoModal
        isOpen={!!insumoToDelete}
        insumo={insumoToDelete}
        onClose={() => setInsumoToDelete(null)}
        onSuccess={fetchInsumos}
      />

      <MovimientoModal
        isOpen={!!selectedInsumoForMov}
        insumo={selectedInsumoForMov}
        onClose={() => setSelectedInsumoForMov(null)}
        onSuccess={fetchInsumos}
      />

      {/* Modal de Vista Ampliada y Descarga de Código QR */}
      <InsumoQrModal
        isOpen={!!selectedInsumoForQr}
        insumo={selectedInsumoForQr}
        onClose={() => setSelectedInsumoForQr(null)}
        onOpenMovimiento={(insumo) => setSelectedInsumoForMov(insumo)}
      />

      {/* Modal de Lector / Escáner QR Multimodal (Movimientos / Edición de Insumos) */}
      <QrScannerModal
        isOpen={qrScannerConfig.isOpen}
        mode={qrScannerConfig.mode}
        insumos={insumos}
        onClose={() => setQrScannerConfig({ isOpen: false, mode: 'movimiento' })}
        onSelectInsumo={(insumo) => {
          if (qrScannerConfig.mode === 'edicion') {
            handleOpenEditInsumoModal(insumo);
          } else {
            setSelectedInsumoForMov(insumo);
          }
        }}
      />
    </div>
  );
}
