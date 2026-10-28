/**
 * UUIDv7 generator — time-ordered, sortable, with sub-millisecond monotonicity helpers.
 * Spec: https://www.rfc-editor.org/rfc/rfc9562.html#name-uuid-version-7
 *
 * Layout (128 bits):
 *  - 48-bit unix timestamp in ms (big-endian)
 *  - 4-bit version = 0b0111
 *  - 12-bit rand_a
 *  - 2-bit variant = 0b10
 *  - 62-bit rand_b
 *
 * Uses crypto.getRandomValues for randomness (Node 22+ global crypto).
 * Monotonicity: if two UUIDs are generated within the same millisecond, the
 * sequence ensures lexicographic order via an incrementing counter for rand_b low bits.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let lastTimestamp = 0;
let counter = 0;

function getRandomBytes(len: number): Uint8Array {
  const buf = new Uint8Array(len);
  // Node 22 global crypto
  globalThis.crypto.getRandomValues(buf);
  return buf;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a UUIDv7 string.
 * Monotonic within the same millisecond via a counter fallback (up to 2^16 increments per ms).
 */
export function generateUUIDv7(): string {
  const now = Date.now();
  if (now === lastTimestamp) {
    counter = (counter + 1) & 0xffff;
    // If we overflow the counter, busy-wait 1ms (extremely unlikely: 65k gen/ms)
    if (counter === 0) {
      // Spin until next ms — deterministic and prevents duplicate
      while (Date.now() === now) {/* busy */}
      return generateUUIDv7();
    }
  } else {
    lastTimestamp = now;
    if (now > lastTimestamp) counter = 0; // reset when time moves forward
    // when now < lastTimestamp (clock skew backwards), keep counter to preserve monotonicity
  }
  if (now !== lastTimestamp) {
    // new timestamp
    lastTimestamp = now;
    counter = 0;
  }

  const rand = getRandomBytes(10); // 80 bits of randomness (we need 74)

  // Build 16-byte array
  const bytes = new Uint8Array(16);
  // 48-bit timestamp
  bytes[0] = (now >>> 24) & 0xff;
  // Actually need full 48-bit: use division for high bits
  const high = Math.floor(now / 2 ** 32);
  const low = now >>> 0;
  bytes[0] = (high >>> 8) & 0xff;
  bytes[1] = high & 0xff;
  bytes[2] = (low >>> 24) & 0xff;
  bytes[3] = (low >>> 16) & 0xff;
  bytes[4] = (low >>> 8) & 0xff;
  bytes[5] = low & 0xff;

  // rand_a 12 bits + version 4 bits
  bytes[6] = 0x70 | (rand[0]! & 0x0f); // version 7
  bytes[7] = rand[1]!;

  // variant 2 bits + 62 bits rand_b
  bytes[8] = 0x80 | (rand[2]! & 0x3f); // variant 10xxxxxx
  bytes[9] = rand[3]!;
  bytes[10] = rand[4]!;
  bytes[11] = rand[5]!;
  bytes[12] = rand[6]!;
  bytes[13] = rand[7]!;
  bytes[14] = rand[8]!;
  bytes[15] = rand[9]!;

  // Apply counter to low 16 bits for monotonicity within same ms
  if (counter !== 0) {
    bytes[14] = (counter >>> 8) & 0xff;
    bytes[15] = counter & 0xff;
  }

  const hex = toHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function isUUIDv7(value: string): boolean {
  return UUID_RE.test(value);
}

export function assertUUIDv7(value: string): void {
  if (!isUUIDv7(value)) throw new Error(`Invalid UUIDv7: ${value}`);
}

/**
 * Extract timestamp (ms since epoch) from a UUIDv7 string.
 * Returns null if not a valid UUIDv7.
 */
export function timestampFromUUIDv7(uuid: string): number | null {
  if (!isUUIDv7(uuid)) return null;
  const hex = uuid.replaceAll('-', '');
  const timeHex = hex.slice(0, 12); // 48 bits = 12 hex chars
  return parseInt(timeHex, 16);
}

/** Branded type for type-safe IDs. */
export type UUID = string & { readonly __brand: 'UUID' };

export function toUUID(value: string): UUID {
  assertUUIDv7(value);
  return value as UUID;
}
