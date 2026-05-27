export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export type HttpQueryValue = string | number | boolean;

export type HttpRequestConfig = {
  baseUrl?: string;
  headers?: Record<string, string>;
  params?: Record<string, HttpQueryValue | undefined>;
  signal?: AbortSignal;
};

export type HttpStreamConfig<TBody = unknown> = HttpRequestConfig & {
  method?: HttpMethod;
  body?: TBody;
  onResponse?: (response: Response) => void;
};

export interface HttpClient {
  get<TResponse>(url: string, config?: HttpRequestConfig): Promise<TResponse>;
  post<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: HttpRequestConfig,
  ): Promise<TResponse>;
  put<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: HttpRequestConfig,
  ): Promise<TResponse>;
  patch<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: HttpRequestConfig,
  ): Promise<TResponse>;
  delete<TResponse>(url: string, config?: HttpRequestConfig): Promise<TResponse>;
  head(url: string, config?: HttpRequestConfig): Promise<void>;
  options(url: string, config?: HttpRequestConfig): Promise<void>;
  stream<TBody = unknown>(
    url: string,
    config: HttpStreamConfig<TBody>,
    onChunk: (chunk: string) => void,
  ): Promise<void>;
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
