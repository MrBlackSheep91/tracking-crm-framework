/**
 * Setup global para tests de Jest
 */

// Mock para localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock para sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock para fetch
global.fetch = jest.fn();

// Mock para window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
  },
  writable: true,
});

// Mock para window.navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    language: 'es-ES',
    platform: 'Win32',
  },
  writable: true,
});

// Mock para window.screen
Object.defineProperty(window, 'screen', {
  value: {
    width: 1920,
    height: 1080,
  },
  writable: true,
});

// Mock para document.visibilityState
Object.defineProperty(document, 'visibilityState', {
  value: 'visible',
  writable: true,
});

// Mock para HTMLCanvasElement (necesario para fingerprint)
const mockGetContext = jest.fn().mockReturnValue({
  fillText: jest.fn(),
  measureText: jest.fn().mockReturnValue({ width: 100 }),
  getImageData: jest.fn().mockReturnValue({ data: new Uint8ClampedArray(4) }),
  canvas: { toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mock') },
  getExtension: jest.fn().mockReturnValue(null)
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockGetContext
});

// Mock para console (necesario para tests de logging)
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Limpiar mocks después de cada test
afterEach(() => {
  jest.clearAllMocks();
});
