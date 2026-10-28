/**
 * Result<T, E> — discriminated union for domain operations.
 * Mirrors Rust's Result / neverthrow pattern. Every failure carries a typed error.
 * Used by Money, Quantity, Rate factories and all domain services.
 */
export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };

export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

export function isOk<T, E>(r: Result<T, E>): r is Ok<T> {
  return r.ok === true;
}

export function isErr<T, E>(r: Result<T, E>): r is Err<E> {
  return r.ok === false;
}

export function map<T, U, E>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> {
  return r.ok ? ok(fn(r.value)) : r;
}

export function flatMap<T, U, E>(r: Result<T, E>, fn: (v: T) => Result<U, E>): Result<U, E> {
  return r.ok ? fn(r.value) : r;
}

export function mapErr<T, E, F>(r: Result<T, E>, fn: (e: E) => F): Result<T, F> {
  return r.ok ? r : err(fn(r.error));
}

export function unwrap<T, E>(r: Result<T, E>): T {
  if (r.ok) return r.value;
  // r is Err<E> here — access via discriminant narrowing without assertion
  return throwErr(r.error);
}

export function unwrapOr<T, E>(r: Result<T, E>, fallback: T): T {
  return r.ok ? r.value : fallback;
}

export function expect<T, E>(r: Result<T, E>, msg: string): T {
  if (r.ok) return r.value;
  return throwErrWithMsg(r.error, msg);
}

function throwErr<E>(error: E): never {
  throw new Error('unwrap() called on Err: ' + String(error));
}

function throwErrWithMsg<E>(error: E, msg: string): never {
  throw new Error(msg + ': ' + String(error));
}
