import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  formatters: {
    level(label) { return { level: label }; },
  },
  redact: {
    paths: ['req.headers.authorization', 'password', 'password_hash', 'secret', 'S3_SECRET_ACCESS_KEY', 'S3_SECRET_KEY'],
    censor: '[REDACTED]',
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
  },
  base: { service: 'erp-api', version: '0.1.0-phase-002' },
  // In production, JSON to stdout; pretty only in dev via pino-pretty transport
});

export function createChildLogger(bindings: Record<string, unknown>): pino.Logger {
  return logger.child(bindings);
}
