import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// Configura el servidor de pruebas con los manejadores
export const server = setupServer(...handlers);

// Configura los hooks globales para el servidor de pruebas
beforeAll(() => {
  // Iniciar el servidor de pruebas antes de todas las pruebas
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  // Limpiar cualquier solicitud no manejada después de cada prueba
  server.resetHandlers();
});

afterAll(() => {
  // Cerrar el servidor después de todas las pruebas
  server.close();
});
