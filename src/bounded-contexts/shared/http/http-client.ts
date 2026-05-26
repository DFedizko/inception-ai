export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpHeaders = Record<string, string>;

export type QueryParams = Record<string, string | number | boolean | undefined>;

export type RequestConfig = {
  baseUrl?: string;
  headers?: HttpHeaders;
  query?: QueryParams;
  signal?: AbortSignal;
};

export type StreamConfig = RequestConfig & {
  method?: HttpMethod;
  body?: unknown;
};

export interface HttpClient {
  get<TResponse>(url: string, config?: RequestConfig): Promise<TResponse>;
  post<TResponse, TBody = unknown>(
    url: string,
    body: TBody,
    config?: RequestConfig,
  ): Promise<TResponse>;
  put<TResponse, TBody = unknown>(
    url: string,
    body: TBody,
    config?: RequestConfig,
  ): Promise<TResponse>;
  patch<TResponse, TBody = unknown>(
    url: string,
    body: TBody,
    config?: RequestConfig,
  ): Promise<TResponse>;
  delete<TResponse>(url: string, config?: RequestConfig): Promise<TResponse>;
  stream(url: string, config?: StreamConfig): AsyncIterable<Uint8Array>;
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(`HTTP request failed with status ${status}.`);
    this.name = "HttpError";
  }
}
