// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';

describe('Minimal Test Suite', () => {
  it('should pass a basic test', () => {
    console.log('Running minimal test');
    expect(1 + 1).toBe(2);
  });

  it('should have window object', () => {
    expect(typeof window).not.toBe('undefined');
  });
});
