import { describe, it, expect } from 'vitest';

describe('Simple Test Suite', () => {
  it('should pass a basic test', () => {
    console.log('Running simple test');
    expect(1 + 1).toBe(2);
  });

  it('should have window object', () => {
    expect(typeof window).not.toBe('undefined');
  });
});
