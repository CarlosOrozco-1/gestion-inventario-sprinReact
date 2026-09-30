import { useEffect, useRef } from 'react';
import { useAuditSocket } from './useAuditSocket';

/**
 * Refresca datos de una página en tiempo real cuando el backend registra algún
 * evento de auditoría que le afecta.
 *
 * Funciona como señal push: el WebSocket `/ws/auditoria` avisa de TODOS los
 * eventos (INSUMO_CREADO, MOVIMIENTO_CREADO, PRESENTACION_AGREGADA, ...) y este
 * hook re-ejecuta `onEvent` SOLO si `eventType` está en la lista pedida. El
 * `onEvent` debe re-consultar los datos por REST autenticado (los datos nunica
 * viajan por el WebSocket).
 *
 * Uso:
 *   useRealtimeSync(['INSUMO_CREADO', 'MOVIMIENTO_CREADO'], () => fetchItems());
 */
export function useRealtimeSync(eventTypes: string[], onEvent: () => void) {
  const { onMessage } = useAuditSocket();
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (eventTypes.length === 0) return;
    return onMessage((payload: any) => {
      if (eventTypes.includes(payload?.eventType)) {
        onEventRef.current();
      }
    });
  }, [onMessage, eventTypes]);
}