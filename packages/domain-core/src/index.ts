/**
 * @erp/domain-core — shared kernel public barrel.
 * Re-exports all primitives for apps and other packages.
 */

export * from './result.js';
export * from './errors.js';
export * from './uuid.js';
export * from './money.js';
export * from './quantity.js';
export * from './rate.js';
export * from './calendar-date.js';

// Convenience namespace for Decimal (re-export configured instance)
export { default as Decimal } from 'decimal.js';
