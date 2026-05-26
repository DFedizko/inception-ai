import {
  HttpError,
  type HttpClient,
  type HttpMethod,
  type HttpRequestConfig,
  type HttpStreamConfig,
} from "./http-client";

export class FetchHttpClient implements HttpClient {
  constructor(private readonly defaults: HttpRequestConfig = {}) {}

  get<TResponse>(url: string, config?: HttpRequestConfig): Promise<TResponse> {
    return this.request<TResponse>("GET", url, undefined, config);
  }

  post<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: HttpRequestConfig,
  ): Promise<TResponse> {
    return this.request<TResponse>("POST", url, body, config);
  }

  put<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: HttpRequestConfig,
  ): Promise<TResponse> {
    return this.request<TResponse>("PUT", url, body, config);
  }

  patch<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: HttpRequestConfig,
  ): Promise<TResponse> {
    return this.request<TResponse>("PATCH", url, body, config);
  }

  delete<TResponse>(url: string, config?: HttpRequestConfig): Promise<TResponse> {
    return this.request<TResponse>("DELETE", url, undefined, config);
  }

  async head(url: string, config?: HttpRequestConfig): Promise<void> {
    await this.send("HEAD", url, undefined, config ?? {});
  }

  async options(url: string, config?: HttpRequestConfig): Promise<void> {
    await this.send("OPTIONS", url, undefined, config ?? {});
  }

  async *stream<TBody = unknown>(
    url: string,
    config: HttpStreamConfig<TBody> = {},
  ): AsyncIterable<string> {
    const response = await this.send(config.method ?? "GET", url, config.body, config);
    config.onResponse?.(response);
    yield* this.readChunks(response);
  }

  private async request<TResponse>(
    method: HttpMethod,
    url: string,
    body: unknown,
    config: HttpRequestConfig = {},
  ): Promise<TResponse> {
    const response = await this.send(method, url, body, config);
    return this.parse<TResponse>(response);
  }

  private async send(
    method: HttpMethod,
    url: string,
    body: unknown,
    config: HttpRequestConfig,
  ): Promise<Response> {
    const hasBody = body !== undefined && method !== "GET" && method !== "HEAD";
    const response = await fetch(this.resolveUrl(url, config), {
      method,
      signal: config.signal,
      headers: {
        ...(hasBody ? { "content-type": "application/json" } : {}),
        ...this.defaults.headers,
        ...config.headers,
      },
      body: hasBody ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw await this.toHttpError(response);
    return response;
  }

  private resolveUrl(url: string, config: HttpRequestConfig): string {
    const baseUrl = config.baseUrl ?? this.defaults.baseUrl ?? "";
    const query = this.toQueryString({ ...this.defaults.params, ...config.params });
    return `${baseUrl}${url}${query}`;
  }

  private toQueryString(params: HttpRequestConfig["params"]): string {
    if (!params) return "";
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) search.append(key, String(value));
    }
    const query = search.toString();
    return query.length > 0 ? `?${query}` : "";
  }

  private async parse<TResponse>(response: Response): Promise<TResponse> {
    if (response.status === 204) return undefined as TResponse;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) return (await response.json()) as TResponse;
    return (await response.text()) as TResponse;
  }

  private async *readChunks(response: Response): AsyncIterable<string> {
    const reader = response.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk.length > 0) yield chunk;
    }
    const tail = decoder.decode();
    if (tail.length > 0) yield tail;
  }

  private async toHttpError(response: Response): Promise<HttpError> {
    return new HttpError(response.status, await this.extractErrorMessage(response));
  }

  private async extractErrorMessage(response: Response): Promise<string> {
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      return body.error?.message ?? response.statusText;
    } catch {
      return response.statusText;
    }
  }
}
