/**
 * Money/quantity/rate zod schemas for transport validation (ADR-0009 / API_CONVENTIONS §7).
 * These are the wire-format patterns enforced on every API boundary.
 */
import { z } from 'zod';

export const MoneyStringSchema = z
  .string()
  .regex(/^-?\d{1,15}(\.\d{1,4})?$/, 'Money must be a decimal string with max 4 dp (e.g., "1234.5000")');

export const QuantityStringSchema = z
  .string()
  .regex(/^-?\d{1,15}(\.\d{1,6})?$/, 'Quantity must be a decimal string with max 6 dp');

export const RateStringSchema = z
  .string()
  .regex(/^-?\d{1,15}(\.\d{1,8})?$/, 'Rate must be a decimal string with max 8 dp');

export const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be ISO 8601 YYYY-MM-DD')
  .refine(v => {
    const d = new Date(v + 'T00:00:00.000Z');
    return !isNaN(d.getTime());
  }, 'Invalid calendar date');

export const UuidSchema = z.string().uuid('Must be a valid UUID');
export const UuidV7Schema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, 'Must be a UUIDv7');
