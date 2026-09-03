import { useEffect } from 'react';

/**
 * Canal WebSocket de auditoría (`/ws/auditoria`).
 *
 * Mantiene una única conexión por pestaña y notifica a los suscriptores cuando
 * llega un evento nuevo. Se usa como SEÑAL push: la página de Auditoría
 * re-consulta `GET /api/auditoria` (REST autenticado) al recibir el aviso; los
 * datos sensibles nunca viajan por el WebSocket.
 *
 * Uso:
 *   const { onMessage } = useAuditSocketDep();
 *   onMessage(() => fetchLogs(page));
 */

type Listener = (payload: any) => void;

const listeners = new Set<Listener>();
let socket: WebSocket | null = null;
let connecting = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

const connect = () => {
  if (socket || connecting) return;
  // En entornos sin WebSocket (tests jsdom) simplemente se omite la conexión.
  if (typeof WebSocket === 'undefined') return;
  connecting = true;

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const url = `${protocol}://${window.location.host}/ws/auditoria`;
  const ws = new WebSocket(url);

  ws.onopen = () => {
    socket = ws;
    connecting = false;
  };

  ws.onmessage = (event) => {
    let payload: any = null;
    try {
      payload = JSON.parse(event.data);
    } catch {
      payload = { raw: event.data };
    }
    listeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error('Error en listener WS de auditoría', e);
      }
    });
  };

  ws.onclose = () => {
    if (socket === ws) socket = null;
    connecting = false;
    // Reintenta reconectar de forma progresiva (el canal se restaura solo).
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = setTimeout(connect, 4000);
  };

  ws.onerror = () => ws.close();
};

const subscribe = (fn: Listener) => {
  listeners.add(fn);
  connect();
  return () => {
    listeners.delete(fn);
  };
};

/**
 * Devuelve una función para suscribirse a los avisos de nuevos eventos de
 * auditoría. La conexión se abre bajo demanda con el primer suscriptor real
 * (opcional iniciarla al montar con `autoConnect`).
 */
export function useAuditSocket(autoConnect = false) {
  useEffect(() => {
    if (autoConnect) connect();
    return () => {
      // No cerramos la conexión aquí: otros suscriptores (p. ej. otras páginas)
      // pueden seguir usándola. Se mantiene viva mientras la pestaña esté abierta.
    };
  }, [autoConnect]);

  return { onMessage: subscribe };
}
