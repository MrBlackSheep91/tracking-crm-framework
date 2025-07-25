// Importaciones necesarias para la configuración de pruebas
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { expect, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// Configuración del servidor MSW para pruebas
const server = setupServer(...handlers);

// Los matchers de @testing-library/jest-dom ya están disponibles globalmente
// gracias a la importación de '@testing-library/jest-dom/vitest'

// Configuración global de pruebas
beforeAll(() => {
  // Iniciar el servidor de pruebas antes de todas las pruebas
  server.listen({ onUnhandledRequest: 'error' });
  
  // Configurar mocks globales
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock de matchMedia
  global.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  // Mock de IntersectionObserver
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
    
    constructor() {
      // Implementación básica
    }
    
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn();
  }
  
  global.IntersectionObserver = MockIntersectionObserver;

  // Mock de scrollTo
  window.scrollTo = vi.fn();
});

// Limpiar después de cada prueba
afterEach(() => {
  cleanup();
  server.resetHandlers();
  
  // Limpiar localStorage
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
  }
});

// Cerrar el servidor después de todas las pruebas
afterAll(() => {
  server.close();
});

// Mock de localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Configurar el mock de localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true,
  enumerable: true,
  writable: true,
});

// Configurar el mock de scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});
