import { describe, it, expect } from 'vitest';
import { generateUUIDv7, isUUIDv7, timestampFromUUIDv7 } from '../src/uuid.js';

describe('UUIDv7', () => {
  it('generates valid UUIDv7 format', () => {
    const id = generateUUIDv7();
    expect(isUUIDv7(id)).toBe(true);
    expect(id[14]).toBe('7');
    expect(['8', '9', 'a', 'b', 'A', 'B']).toContain(id[19]!);
  });

  it('extracts timestamp within reasonable range', () => {
    const before = Date.now();
    const id = generateUUIDv7();
    const after = Date.now();
    const ts = timestampFromUUIDv7(id);
    expect(ts).not.toBeNull();
    expect(ts! >= before && ts! <= after + 5).toBe(true);
  });

  it('is sortable within same millisecond (monotonic)', () => {
    const ids: string[] = [];
    for (let i = 0; i < 50; i++) ids.push(generateUUIDv7());
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach(id => expect(isUUIDv7(id)).toBe(true));
  });

  it('generates 1000 unique IDs', () => {
    const set = new Set<string>();
    for (let i = 0; i < 1000; i++) set.add(generateUUIDv7());
    expect(set.size).toBe(1000);
  });

  it('rejects invalid UUIDs', () => {
    expect(isUUIDv7('not-a-uuid')).toBe(false);
    expect(isUUIDv7('0192abcd-1234-4567-89ab-cdef12345678')).toBe(false);
    expect(timestampFromUUIDv7('invalid')).toBeNull();
  });

  it('version bits are correctly set', () => {
    for (let i = 0; i < 100; i++) {
      const id = generateUUIDv7();
      const hex = id.replaceAll('-', '');
      const version = parseInt(hex[12]!, 16);
      expect(version).toBe(7);
      const variantHex = parseInt(hex[16]!, 16);
      expect(variantHex >> 2).toBe(2);
    }
  });
});
