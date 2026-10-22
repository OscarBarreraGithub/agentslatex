export class RequestError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public retryAfterMs = 0,
  ) {
    super(message);
  }
}
export async function request(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<Response> {
  const r = await fetch("/api" + path, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(typeof init.body === "string"
        ? { "Content-Type": "application/json" }
        : {}),
      ...init.headers,
    },
  });
  if (r.status === 503 && retry) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return request(path, init, false);
  }
  if (!r.ok) {
    const body = (await r
      .json()
      .catch(() => ({ error: "Request failed. Please try again." }))) as {
      error: string;
      code?: string;
    };
    const retry = r.headers.get("Retry-After");
    const retryMs = retry ? (Number.isFinite(Number(retry)) ? Number(retry) * 1000 : Date.parse(retry) - Date.now()) : 0;
    throw new RequestError(r.status, body.error, body.code, Number.isFinite(retryMs) ? Math.max(0, retryMs) : 0);
  }
  return r;
}
export async function api<T>(
  path: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  const r = await request(path, {
    method: method ?? (body === undefined ? "GET" : "POST"),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return r.json() as Promise<T>;
}
export const escapeHtml = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
