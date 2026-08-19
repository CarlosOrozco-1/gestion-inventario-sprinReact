import { useEffect, useRef } from 'react';
import { getWsUrl } from '../services/api';

export default function useRealtime(onEvent) {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    let ws;
    let retryTimer;
    let closed = false;

    const connect = () => {
      try {
        ws = new WebSocket(getWsUrl());

        ws.onopen = () => {};

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data?.type && typeof callbackRef.current === 'function') {
              callbackRef.current(data.type, data);
            }
          } catch (e) {}
        };

        ws.onclose = () => {
          if (!closed) {
            retryTimer = setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          try { ws.close(); } catch (e) {}
        };
      } catch (e) {}
    };

    connect();

    return () => {
      closed = true;
      clearTimeout(retryTimer);
      try { ws?.close(); } catch (e) {}
    };
  }, []);
}
