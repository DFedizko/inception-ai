import {
  HttpError,
  type HttpClient,
  type HttpMethod,
  type RequestConfig,
  type StreamConfig,
} from "./http-client";

type FetchFn = typeof fetch;

export class FetchHttpClient implements HttpClient {
  constructor(private readonly fetchFn: FetchFn = fetch) {}

  get<TResponse>(url: string, config?: RequestConfig): Promise<TResponse> {
    return this.request<TResponse>("GET", url, undefined, config);
  }

  post<TResponse, TBody = unknown>(
    url: string,
    body: TBody,
    config?: RequestConfig,
  ): Promise<TResponse> {
    return this.request<TResponse>("POST", url, body, config);
  }

  put<TResponse, TBody = unknown>(
    url: string,
    body: TBody,
    config?: RequestConfig,
  ): Promise<TResponse> {
    return this.request<TResponse>("PUT", url, body, config);
  }

  patch<TResponse, TBody = unknown>(
    url: string,
    body: TBody,
    config?: RequestConfig,
  ): Promise<TResponse> {
    return this.request<TResponse>("PATCH", url, body, config);
  }

  delete<TResponse>(url: string, config?: RequestConfig): Promise<TResponse> {
    return this.request<TResponse>("DELETE", url, undefined, config);
  }

  async stream(
    url: string,
    config: StreamConfig | undefined,
    onChunk: (chunk: Uint8Array) => void,
  ): Promise<void> {
    const response = await this.fetchFn(
      this.resolveUrl(url, config),
      this.buildInit(config?.method ?? "GET", config?.body, config),
    );
    if (!response.ok) {
      throw new HttpError(response.status, await response.text());
    }
    await this.pumpChunks(response, onChunk);
  }

  private async pumpChunks(
    response: Response,
    onChunk: (chunk: Uint8Array) => void,
  ): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) return;
    for (let read = await reader.read(); !read.done; read = await reader.read()) {
      this.emitChunk(read.value, onChunk);
    }
  }

  private emitChunk(value: Uint8Array | undefined, onChunk: (chunk: Uint8Array) => void): void {
    if (!value) return;
    onChunk(value);
  }

  private async request<TResponse>(
    method: HttpMethod,
    url: string,
    body: unknown,
    config?: RequestConfig,
  ): Promise<TResponse> {
    const response = await this.fetchFn(
      this.resolveUrl(url, config),
      this.buildInit(method, body, config),
    );
    if (!response.ok) {
      throw new HttpError(response.status, await response.text());
    }
    return this.parseBody<TResponse>(response);
  }

  private buildInit(method: HttpMethod, body: unknown, config?: RequestConfig): RequestInit {
    const hasBody = body !== undefined;
    const headers: Record<string, string> = { ...config?.headers };
    if (hasBody && headers["Content-Type"] === undefined) {
      headers["Content-Type"] = "application/json";
    }
    return {
      method,
      headers,
      signal: config?.signal,
      body: hasBody ? JSON.stringify(body) : undefined,
    };
  }

  private resolveUrl(url: string, config?: RequestConfig): string {
    const absolute = config?.baseUrl ? new URL(url, config.baseUrl) : new URL(url);
    if (config?.query) {
      for (const [key, value] of Object.entries(config.query)) {
        if (value !== undefined) {
          absolute.searchParams.set(key, String(value));
        }
      }
    }
    return absolute.toString();
  }

  private async parseBody<TResponse>(response: Response): Promise<TResponse> {
    if (response.status === 204) {
      return undefined as TResponse;
    }
    const text = await response.text();
    if (text.length === 0) {
      return undefined as TResponse;
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return JSON.parse(text) as TResponse;
    }
    return text as TResponse;
  }
}
