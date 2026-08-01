import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import InsumoModal from '../components/InsumoModal';
import MovimientoModal from '../components/MovimientoModal';
import InsumosModule from '../components/InsumosModule';
import MovimientosModule from '../components/MovimientosModule';
import UsuariosModule from '../components/UsuariosModule';
import ReportesModule from '../components/ReportesModule';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('resumen');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isInsumoModalOpen, setIsInsumoModalOpen] = useState(false);
  const [selectedInsumoForMov, setSelectedInsumoForMov] = useState(null);
  const [error, setError] = useState('');

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const fetchInsumos = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get('/insumos');
      setInsumos(response.data || []);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los insumos desde el servidor.');
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

  return (
    <div className="app-layout">
      {/* Sidebar Plegable del Lado Izquierdo */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
      />

      {/* Contenido Principal */}
      <div className="main-content">
        <Navbar
          toggleSidebar={toggleSidebar}
          isCollapsed={isSidebarCollapsed}
          activeTab={activeTab}
        />

        <main style={{ flex: 1, padding: '32px 28px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f87171',
              padding: '14px 18px',
              borderRadius: '8px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>⚠️ {error}</div>
              <button onClick={fetchInsumos} className="btn btn-secondary sharp-border" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                Reintentar
              </button>
            </div>
          )}

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
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={fetchInsumos} className="btn btn-secondary sharp-border">
                    🔄 Actualizar
                  </button>
                  <button onClick={() => setIsInsumoModalOpen(true)} className="btn btn-primary">
                    ✨ Nuevo Insumo
                  </button>
                </div>
              </div>

              {/* Tarjetas de Estadísticas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <div className="glass-card sharp-border" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, uppercase: true }}>Total Insumos</div>
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

              {/* Acceso Rápido a Módulos */}
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Accesos Directos a Módulos</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div onClick={() => setActiveTab('insumos')} className="glass-card sharp-border" style={{ padding: '22px', cursor: 'pointer' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📦</div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Catálogo de Insumos</h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Explorá la lista completa de artículos, buscá por código y gestioná el inventario.
                  </p>
                </div>

                <div onClick={() => setActiveTab('movimientos')} className="glass-card sharp-border" style={{ padding: '22px', cursor: 'pointer' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🔄</div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Movimientos de Stock</h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Registrá entradas, salidas, ajustes físicos y correcciones de inventario.
                  </p>
                </div>

                <div onClick={() => setActiveTab('usuarios')} className="glass-card sharp-border" style={{ padding: '22px', cursor: 'pointer' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>👥</div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Usuarios y Permisos</h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Revisá la información del perfil actual y la matriz de permisos del sistema.
                  </p>
                </div>

                <div onClick={() => setActiveTab('reportes')} className="glass-card sharp-border" style={{ padding: '22px', cursor: 'pointer' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📈</div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Reportes y Alertas</h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Consultá artículos en nivel crítico y estadísticas del almacén.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'insumos' && (
            <InsumosModule
              insumos={insumos}
              loading={loading}
              search={search}
              setSearch={setSearch}
              fetchInsumos={fetchInsumos}
              onOpenNewInsumoModal={() => setIsInsumoModalOpen(true)}
              onOpenMovimientoModal={(item) => setSelectedInsumoForMov(item)}
            />
          )}

          {activeTab === 'movimientos' && (
            <MovimientosModule
              insumos={insumos}
              onOpenMovimientoModal={(item) => setSelectedInsumoForMov(item)}
            />
          )}

          {activeTab === 'usuarios' && (
            <UsuariosModule user={user} />
          )}

          {activeTab === 'reportes' && (
            <ReportesModule insumos={insumos} />
          )}
        </main>
      </div>

      {/* Modales */}
      <InsumoModal
        isOpen={isInsumoModalOpen}
        onClose={() => setIsInsumoModalOpen(false)}
        onSuccess={fetchInsumos}
      />

      <MovimientoModal
        isOpen={!!selectedInsumoForMov}
        insumo={selectedInsumoForMov}
        onClose={() => setSelectedInsumoForMov(null)}
        onSuccess={fetchInsumos}
      />
    </div>
  );
}
