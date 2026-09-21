import { describe, it, expect, vi } from 'vitest';

class MockOscillator {
  type = '';
  frequency = { value: 0 };
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockGain {
  gain = {
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
  connect = vi.fn();
}

function installMockAudioContext() {
  const createOscillator = vi.fn(() => new MockOscillator());
  const createGain = vi.fn(() => new MockGain());
  const AudioContextMock = class {
    currentTime = 0;
    state = 'running';
    destination = {};
    resume = vi.fn();
    createOscillator = createOscillator;
    createGain = createGain;
  };
  vi.stubGlobal('AudioContext', AudioContextMock);
  return { createOscillator, createGain };
}

// Carga el módulo desde cero para que cada test parta con estado limpio.
async function freshPlayQrSuccess() {
  vi.resetModules();
  const m = await import('./sound');
  return m.playQrSuccess;
}

describe('playQrSuccess (sonido de escaneo exitoso)', () => {
  it('reproduce el doble beep cuando AudioContext está disponible', async () => {
    const { createOscillator, createGain } = installMockAudioContext();
    const play = await freshPlayQrSuccess();

    expect(() => play()).not.toThrow();
    // Dos tonos: dos osciladores y dos nodos de ganancia.
    expect(createOscillator).toHaveBeenCalledTimes(2);
    expect(createGain).toHaveBeenCalledTimes(2);
  });

  it('no lanza errores si el navegador no expone AudioContext', async () => {
    vi.stubGlobal('AudioContext', undefined);
    const play = await freshPlayQrSuccess();

    expect(() => play()).not.toThrow();
  });
});