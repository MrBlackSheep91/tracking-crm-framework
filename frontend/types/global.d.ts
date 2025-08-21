/**
 * Declaraciones de tipos globales para el framework de tracking
 */

// Tipos para Node.js en entorno browser
declare namespace NodeJS {
  interface Timeout {}
}

// Extensiones para Window
declare global {
  interface Window {
    InnovaTracker?: any;
    INNOVA_TRACKING_CONFIG?: any;
  }
}

// WebGL Context types para fingerprinting
interface WebGLRenderingContext {
  getExtension(name: string): any;
  getParameter(pname: number): any;
  VERSION: number;
  SHADING_LANGUAGE_VERSION: number;
}

interface WebGL2RenderingContext extends WebGLRenderingContext {
  getExtension(name: string): any;
  getParameter(pname: number): any;
}

export {};
