/**
 * Tests para UUID utilities
 */

import { generateUUID } from '../../src/utils/uuid';

describe('UUID Utils', () => {
  describe('generateUUID', () => {
    test('debería generar UUID válido v4', () => {
      const uuid = generateUUID();
      
      // Regex para UUID v4
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      expect(uuid).toMatch(uuidV4Regex);
      expect(typeof uuid).toBe('string');
      expect(uuid.length).toBe(36);
    });

    test('debería generar UUIDs únicos', () => {
      const uuids = new Set();
      const count = 1000;

      for (let i = 0; i < count; i++) {
        uuids.add(generateUUID());
      }

      expect(uuids.size).toBe(count);
    });

    test('debería tener formato correcto', () => {
      const uuid = generateUUID();
      const parts = uuid.split('-');

      expect(parts).toHaveLength(5);
      expect(parts[0]).toHaveLength(8);
      expect(parts[1]).toHaveLength(4);
      expect(parts[2]).toHaveLength(4);
      expect(parts[3]).toHaveLength(4);
      expect(parts[4]).toHaveLength(12);

      // Verificar que la versión sea 4
      expect(parts[2][0]).toBe('4');
    });

    test('debería usar caracteres hexadecimales válidos', () => {
      const uuid = generateUUID();
      const hexRegex = /^[0-9a-f-]+$/i;
      
      expect(uuid).toMatch(hexRegex);
    });
  });
});
