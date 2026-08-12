import API from './api';

/**
 * Servicio de comunicación formal con la Base de Datos (Tabla 'bitacora')
 */

export async function registrarBitacora({
  accion,
  modulo,
  descripcion,
  justificacion,
  usuarioId,
  usuarioNombre,
  entidadId = null,
  entidadTipo = null,
  datosAnteriores = null,
  datosNuevos = null
}) {
  const registro = {
    accion,
    modulo,
    descripcion,
    justificacion,
    usuarioId,
    usuarioNombre,
    entidadId,
    entidadTipo,
    datosAnteriores: datosAnteriores ? JSON.stringify(datosAnteriores) : null,
    datosNuevos: datosNuevos ? JSON.stringify(datosNuevos) : null
  };

  try {
    const response = await API.post('/bitacora', registro);
    return response.data;
  } catch (err) {
    console.error("Error al registrar en la bitácora de la base de datos:", err);
  }
}

export async function obtenerBitacora() {
  try {
    const response = await API.get('/bitacora');
    return response.data || [];
  } catch (err) {
    console.error("Error al consultar la bitácora de la base de datos:", err);
    return [];
  }
}

export async function obtenerBitacoraPorModulo(modulo) {
  try {
    const response = await API.get(`/bitacora/modulo/${modulo}`);
    return response.data || [];
  } catch (err) {
    console.error("Error al consultar bitácora por módulo:", err);
    return [];
  }
}
