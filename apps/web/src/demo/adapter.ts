import {
  type AxiosAdapter,
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosResponse,
} from 'axios';
import { createDemoBackend } from './backend';

const LATENCIA_MS = 180;

/** Troca o transporte HTTP do axios pelo backend em memória. Interceptors seguem valendo. */
export function instalarDemo(client: AxiosInstance): void {
  const backend = createDemoBackend();

  const adapter: AxiosAdapter = async (config) => {
    await new Promise((r) => setTimeout(r, LATENCIA_MS));
    const { status, data } = backend.handle({
      method: config.method ?? 'get',
      url: config.url ?? '/',
      data: config.data,
    });
    const response: AxiosResponse = {
      data,
      status,
      statusText: String(status),
      headers: new AxiosHeaders({ 'content-type': 'application/json' }),
      config,
      request: null,
    };
    const ok = config.validateStatus ? config.validateStatus(status) : status < 400;
    if (ok) return response;
    const message = (data as { message?: string } | null)?.message ?? `HTTP ${status}`;
    throw new AxiosError(message, AxiosError.ERR_BAD_RESPONSE, config, null, response);
  };

  client.defaults.adapter = adapter;
}
