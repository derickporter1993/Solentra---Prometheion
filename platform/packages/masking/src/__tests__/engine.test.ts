import { describe, it, expect } from 'vitest';
import { MaskingEngine } from '../engine.js';
import { redact } from '../strategies/redact.js';
import { hash } from '../strategies/hash.js';

describe('Masking Engine', () => {
  describe('MaskingEngine', () => {
    it('should be constructable', () => {
      const engine = new MaskingEngine();
      expect(engine).toBeDefined();
    });
  });

  describe('Redact Strategy', () => {
    it('should redact string values', () => {
      const result = redact('sensitive data');
      expect(result).not.toBe('sensitive data');
      expect(result).toMatch(/^\*+$/);
    });

    it('should handle empty strings', () => {
      const result = redact('');
      expect(result).toBe('');
    });
  });

  describe('Hash Strategy', () => {
    it('should hash string values', () => {
      const result = hash('test value');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should produce consistent hashes', () => {
      const result1 = hash('same input');
      const result2 = hash('same input');
      expect(result1).toBe(result2);
    });

    it('should produce different hashes for different inputs', () => {
      const result1 = hash('input one');
      const result2 = hash('input two');
      expect(result1).not.toBe(result2);
    });
  });
});
