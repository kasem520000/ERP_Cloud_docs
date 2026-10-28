import { describe, it, expect } from 'vitest';
import { ok, err, isOk, isErr, map, flatMap, unwrap, unwrapOr, expect as expectResult } from '../src/result.js';

describe('Result', () => {
  it('ok/err discriminants', () => {
    const a = ok(42);
    const b = err('oops');
    expect(isOk(a)).toBe(true);
    expect(isErr(a)).toBe(false);
    expect(isOk(b)).toBe(false);
    expect(isErr(b)).toBe(true);
  });

  it('map transforms ok, leaves err', () => {
    expect(map(ok(2), x => x * 3)).toEqual({ ok: true, value: 6 });
    expect(map(err('e'), (x: number) => x * 3)).toEqual({ ok: false, error: 'e' });
  });

  it('flatMap chains', () => {
    const parse = (s: string) => (s === 'bad' ? err('parse error') : ok(Number(s)));
    expect(flatMap(ok('42'), parse)).toEqual({ ok: true, value: 42 });
    expect(flatMap(ok('bad'), parse)).toEqual({ ok: false, error: 'parse error' });
    expect(flatMap(err('prev') as ReturnType<typeof parse>, parse)).toEqual({ ok: false, error: 'prev' });
  });

  it('unwrap throws on err', () => {
    expect(unwrap(ok(1))).toBe(1);
    expect(() => unwrap(err('fail'))).toThrow(/unwrap/);
  });

  it('unwrapOr returns fallback', () => {
    expect(unwrapOr(ok(5), 0)).toBe(5);
    expect(unwrapOr(err('e'), 99)).toBe(99);
  });

  it('expect throws with message', () => {
    expect(expectResult(ok('hi'), 'should not throw')).toBe('hi');
    expect(() => expectResult(err('bad'), 'custom msg')).toThrow(/custom msg/);
  });
});
