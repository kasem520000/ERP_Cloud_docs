import { trace } from '@opentelemetry/api';

let initialized = false;

export async function initOtel(): Promise<void> {
  if (initialized) return;
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) { initialized = true; return; }
  try {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const sdk = new NodeSDK({ serviceName: 'erp-api' });
    sdk.start();
    initialized = true;
  } catch { initialized = true; }
}

export function getTracer(name = 'erp-api'): ReturnType<typeof trace.getTracer> {
  return trace.getTracer(name);
}
