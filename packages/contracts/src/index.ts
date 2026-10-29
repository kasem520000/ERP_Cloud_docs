/** @erp/contracts — the single source of API truth (ADR-0002). */
export {
  ContractKeyConflictError,
  ContractKeyNotFoundError,
  getContractSchema,
  listContractSchemas,
  registerContractSchema,
  resetContractRegistryForTests,
} from "./registry";
export { ERROR_CODES, isErrorCode, type ErrorCode } from "./error-codes";
export { FEATURE_KEYS, type FeatureKey } from "./feature-keys";
export {
  FX_RATE_PATTERN,
  ISO_DATE_PATTERN,
  MONEY_AMOUNT_PATTERN,
  PERCENTAGE_PATTERN,
  QUANTITY_PATTERN,
  UTC_TIMESTAMP_PATTERN,
  fxRateSchema,
  isoDateSchema,
  moneyAmountSchema,
  percentageSchema,
  quantitySchema,
  utcTimestampSchema,
} from "./wire";
