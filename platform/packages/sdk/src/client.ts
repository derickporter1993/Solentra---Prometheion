/**
 * Platform API Client
 *
 * Typed client for interacting with the Salesforce DevOps Platform API
 */

export interface ClientConfig {
  baseUrl: string;
  apiKey?: string;
  accessToken?: string;
  workspaceId?: string;
  onTokenRefresh?: (newToken: string) => void;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Base API client with authentication and request handling
 */
export class ApiClient {
  private config: ClientConfig;

  constructor(config: ClientConfig) {
    this.config = config;
  }

  /**
   * Make an authenticated API request
   */
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.params);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    if (this.config.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.accessToken}`;
    } else if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }

    if (this.config.workspaceId) {
      headers['X-Workspace-Id'] = this.config.workspaceId;
    }

    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await this.parseError(response);
      throw new PlatformApiError(error.message, error.code, response.status, error.details);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  /**
   * Make a GET request
   */
  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(path, { method: 'GET', params });
  }

  /**
   * Make a POST request
   */
  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body });
  }

  /**
   * Make a PUT request
   */
  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body });
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body });
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  /**
   * Subscribe to SSE stream
   */
  subscribeToStream(
    path: string,
    onMessage: (event: MessageEvent) => void,
    onError?: (error: Event) => void
  ): EventSource {
    const url = this.buildUrl(path);
    const eventSource = new EventSource(url, {
      // Note: EventSource doesn't support custom headers natively
      // In production, use a polyfill or pass token as query param
    });

    eventSource.onmessage = onMessage;
    if (onError) {
      eventSource.onerror = onError;
    }

    return eventSource;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<ClientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set workspace context
   */
  setWorkspace(workspaceId: string): void {
    this.config.workspaceId = workspaceId;
  }

  /**
   * Set access token
   */
  setAccessToken(token: string): void {
    this.config.accessToken = token;
  }

  private buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    const url = new URL(path, this.config.baseUrl);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private async parseError(response: Response): Promise<ApiError> {
    try {
      const body = await response.json();
      return {
        code: body.code ?? 'UNKNOWN_ERROR',
        message: body.message ?? response.statusText,
        details: body.details,
      };
    } catch {
      return {
        code: 'UNKNOWN_ERROR',
        message: response.statusText,
      };
    }
  }
}

export class PlatformApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PlatformApiError';
  }
}
