import { CliError, ExitCode } from './envelope';
import type { CliConfig } from './config';

export class ApiClient {
  constructor(private readonly config: CliConfig) {}

  public async request<T = any>(
    path: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      body?: any;
      query?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const method = options.method || 'GET';

    // Dry Run Guard for Mutating Requests
    if (this.config.dryRun && method !== 'GET') {
      return {
        dryRun: true,
        message: 'Action simulated successfully. No data was mutated on the server.',
        target: {
          method,
          path,
          payload: options.body,
        },
      } as unknown as T;
    }

    const url = new URL(path.startsWith('/') ? path : `/${path}`, this.config.apiUrl);
    if (options.query) {
      for (const [k, v] of Object.entries(options.query)) {
        if (v !== undefined) {
          url.searchParams.set(k, String(v));
        }
      }
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...options.headers,
    };

    if (options.body && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/json';
    }

    // Attach credentials
    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    } else if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    try {
      const res = await fetch(url.toString(), {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      if (!res.ok) {
        this.handleHttpError(res.status, data, method, path);
      }

      return data as T;
    } catch (err: any) {
      if (err instanceof CliError) {
        throw err;
      }
      throw new CliError({
        code: 'NETWORK_ERROR',
        message: `Failed to connect to ${this.config.apiUrl}: ${err.message}`,
        exitCode: ExitCode.TRANSIENT_ERROR,
        retryable: true,
        suggestedFix: 'Check if the backend server is running and accessible.',
      });
    }
  }

  private handleHttpError(status: number, body: any, method: string, path: string): never {
    const message = body?.error || body?.message || `HTTP ${status} error on ${method} ${path}`;

    if (status === 400 || status === 422) {
      throw new CliError({
        code: 'VALIDATION_ERROR',
        message,
        exitCode: ExitCode.VALIDATION_ERROR,
        retryable: false,
        suggestedFix: 'Inspect the command arguments or payload against the schema: `flashlearn schema`',
        details: body?.details || body,
      });
    }

    if (status === 401) {
      throw new CliError({
        code: 'UNAUTHORIZED',
        message,
        exitCode: ExitCode.PERMISSION_DENIED,
        retryable: false,
        suggestedFix: 'Provide an active token via `--token` or an API key via `--api-key` or env FL_API_KEY.',
      });
    }

    if (status === 403) {
      throw new CliError({
        code: 'FORBIDDEN',
        message,
        exitCode: ExitCode.PERMISSION_DENIED,
        retryable: false,
        suggestedFix: 'Action requires elevated role (e.g. creator or superadmin).',
      });
    }

    if (status === 404) {
      throw new CliError({
        code: 'NOT_FOUND',
        message,
        exitCode: ExitCode.GENERAL_ERROR,
        retryable: false,
        suggestedFix: 'Verify that the target resource ID or slug exists.',
      });
    }

    if (status >= 500) {
      throw new CliError({
        code: 'SERVER_ERROR',
        message,
        exitCode: ExitCode.TRANSIENT_ERROR,
        retryable: true,
        suggestedFix: 'Backend encountered an internal error. Retry with exponential backoff.',
        details: body,
      });
    }

    throw new CliError({
      code: `HTTP_${status}`,
      message,
      exitCode: ExitCode.GENERAL_ERROR,
      retryable: false,
      details: body,
    });
  }
}
