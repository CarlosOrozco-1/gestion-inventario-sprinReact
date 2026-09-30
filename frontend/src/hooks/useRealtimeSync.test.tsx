import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import type { ReactNode } from 'react';
import { useRealtimeSync } from './useRealtimeSync';

const auditSocketMocks = vi.hoisted(() => ({ onMessage: vi.fn() }));
vi.mock('./useAuditSocket', () => ({
  useAuditSocket: () => auditSocketMocks,
}));

function Emitidor({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

describe('useRealtimeSync', () => {
  let listener: (payload: any) => void;

  beforeEach(() => {
    auditSocketMocks.onMessage.mockClear();
    listener = undefined as any;
    auditSocketMocks.onMessage.mockImplementation((fn: (payload: any) => void) => {
      listener = fn;
      return () => {};
    });
  });

  it('ejecuta onEvent solo cuando el eventType está en la lista', () => {
    const onEvent = vi.fn();
    renderHook(() => useRealtimeSync(['INSUMO_CREADO', 'MOVIMIENTO_CREADO'], onEvent), {
      wrapper: Emitidor,
    });

    act(() => listener({ eventType: 'MOVIMIENTO_CREADO' }));
    act(() => listener({ eventType: 'LOGIN' }));
    act(() => listener({ eventType: 'INSUMO_CREADO' }));

    expect(onEvent).toHaveBeenCalledTimes(2);
  });

  it('no hace nada si la lista de eventos está vacía', () => {
    const onEvent = vi.fn();
    renderHook(() => useRealtimeSync([], onEvent), { wrapper: Emitidor });
    expect(auditSocketMocks.onMessage).not.toHaveBeenCalled();
  });
});