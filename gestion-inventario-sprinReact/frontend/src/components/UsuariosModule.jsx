import React, { useState, useEffect } from 'react';
import API from '../services/api';
import UsuarioModal from './UsuarioModal';
import DeleteUsuarioModal from './DeleteUsuarioModal';

export default function UsuariosModule({ user }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [error, setError] = useState('');

  const isAdmin = user?.rol === 'ADMIN';

  const fetchUsuarios = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/usuarios');
      setUsuarios(res.data || []);
    } catch (err) {
      console.error("Error al obtener usuarios de la base de datos:", err);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleCreateOrUpdateSuccess = () => {
    fetchUsuarios();
  };

  const handleDeleteSuccess = () => {
    fetchUsuarios();
  };

  const filteredUsuarios = usuarios.filter(u =>
    u.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.rol?.toLowerCase().includes(search.toLowerCase())
  );

  const rolesMatrix = [
    { funcion: 'Gestionar usuarios y credenciales', admin: true, jefe: false, auxiliar: false },
    { funcion: 'Agregar catálogo de nuevos insumos', admin: true, jefe: true, auxiliar: false },
    { funcion: 'Editar detalles de insumos existentes', admin: true, jefe: true, auxiliar: false },
    { funcion: 'Eliminar insumos del catálogo', admin: true, jefe: false, auxiliar: false },
    { funcion: 'Registrar entradas de almacén', admin: true, jefe: true, auxiliar: true },
    { funcion: 'Registrar salidas de productos', admin: true, jefe: true, auxiliar: true },
    { funcion: 'Registrar ajustes y correcciones', admin: true, jefe: true, auxiliar: false },
    { funcion: 'Visualizar tabla de inventario', admin: true, jefe: true, auxiliar: true },
    { funcion: 'Visualizar Alertas de Stock', admin: true, jefe: true, auxiliar: false },
    { funcion: 'Consultar Bitácora de Registro de Cambios', admin: true, jefe: true, auxiliar: false },
  ];

  return (
    <div className="module-fade-in">
      {/* Header del Módulo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>👥</span> Módulo de Usuarios y Roles
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
            Gestión de usuarios registrados en la base de datos y asignación de roles estrictos
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setUserToEdit(null); setIsModalOpen(true); }}
            className="btn btn-primary"
          >
            ✨ Registrar Nuevo Usuario
          </button>
        )}
      </div>

      {/* Tarjeta de Usuario Activo */}
      <div className="glass-card sharp-border-accent" style={{ padding: '24px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--accent-cyan)' }}>
          👤 Tu Sesión Actual
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Nombre</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>{user?.nombre || 'Usuario Demo'}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Correo Electrónico</span>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-blue)', marginTop: '2px' }}>{user?.email || 'admin@inventario.com'}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Rol y Permisos</span>
            <div style={{ marginTop: '4px' }}>
              <span className={`badge ${user?.rol === 'ADMIN' ? 'badge-blue' : user?.rol === 'JEFE' ? 'badge-amber' : 'badge-emerald'}`}>
                {user?.rol || 'ADMIN'} (Nivel {user?.rol === 'ADMIN' ? 100 : user?.rol === 'JEFE' ? 50 : 10})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Usuarios Registrados en la BD */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>
            📋 Usuarios Registrados en la Base de Datos
          </h2>
          {!isAdmin && (
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              🔒 Solo Administradores pueden crear o modificar usuarios
            </span>
          )}
        </div>

        {/* Buscador de usuarios */}
        <div className="glass-card sharp-border" style={{ padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.1rem', color: 'var(--accent-blue)' }}>🔍</span>
          <input
            type="text"
            className="input-field"
            placeholder="Buscar por nombre, correo o rol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: '4px', fontSize: '0.92rem' }}
          />
        </div>

        <div className="glass-card sharp-border" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo Electrónico</th>
                  <th>Rol Asignado</th>
                  <th>Nivel</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      Cargando lista de usuarios...
                    </td>
                  </tr>
                ) : filteredUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No se encontraron usuarios registrados.
                    </td>
                  </tr>
                ) : (
                  filteredUsuarios.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: item.rol === 'ADMIN' ? 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))' : item.rol === 'JEFE' ? 'linear-gradient(135deg, var(--accent-amber), #d97706)' : 'linear-gradient(135deg, var(--accent-emerald), #059669)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: '#fff'
                        }}>
                          {item.nombre?.charAt(0) || 'U'}
                        </div>
                        {item.nombre}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.email}</td>
                      <td>
                        <span className={`badge ${item.rol === 'ADMIN' ? 'badge-blue' : item.rol === 'JEFE' ? 'badge-amber' : 'badge-emerald'}`}>
                          {item.rol}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>Nivel {item.rol === 'ADMIN' ? 100 : item.rol === 'JEFE' ? 50 : 10}</td>
                      <td style={{ textAlign: 'right' }}>
                        {isAdmin ? (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => { setUserToEdit(item); setIsModalOpen(true); }}
                              className="btn btn-secondary sharp-border"
                              style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                              title="Editar Usuario o Cambiar Rol"
                            >
                              ✏️ Cambiar Rol
                            </button>
                            <button
                              onClick={() => setUserToDelete(item)}
                              className="btn btn-secondary sharp-border"
                              style={{ padding: '5px 10px', fontSize: '0.78rem', borderColor: 'rgba(244, 63, 94, 0.4)', color: '#f87171' }}
                              title="Eliminar Usuario"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>Sin permisos</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Matriz de Permisos */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Matriz de Permisos por Rol</h2>
      <div className="glass-card sharp-border" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Función o Módulo</th>
                <th style={{ textAlign: 'center' }}>Admin</th>
                <th style={{ textAlign: 'center' }}>Jefe</th>
                <th style={{ textAlign: 'center' }}>Auxiliar</th>
              </tr>
            </thead>
            <tbody>
              {rolesMatrix.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 500, color: '#fff' }}>{row.funcion}</td>
                  <td style={{ textAlign: 'center' }}>{row.admin ? '✅ Sí' : '❌ No'}</td>
                  <td style={{ textAlign: 'center' }}>{row.jefe ? '✅ Sí' : '❌ No'}</td>
                  <td style={{ textAlign: 'center' }}>{row.auxiliar ? '✅ Sí' : '❌ No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      <UsuarioModal
        isOpen={isModalOpen}
        userToEdit={userToEdit}
        onClose={() => { setIsModalOpen(false); setUserToEdit(null); }}
        onSuccess={handleCreateOrUpdateSuccess}
      />

      <DeleteUsuarioModal
        isOpen={!!userToDelete}
        userToDelete={userToDelete}
        onClose={() => setUserToDelete(null)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
