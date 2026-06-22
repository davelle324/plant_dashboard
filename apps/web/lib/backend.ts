const API_BASE_URL = process.env.API_INTERNAL_URL ?? "http://api:8000";

export async function backendRequest(path: string, init?: RequestInit) {
  const initHeaders = init?.headers;
  const forwardedHeaders: Record<string, string> =
    initHeaders instanceof Headers
      ? Object.fromEntries(initHeaders.entries())
      : (initHeaders as Record<string, string> | undefined) ?? {};

  const headers: Record<string, string> = {
    ...(init?.body ? { "Content-Type": "application/json" } : {}),
    ...forwardedHeaders,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    method: init?.method,
    body: init?.body,
    headers,
  });

  return response;
}
