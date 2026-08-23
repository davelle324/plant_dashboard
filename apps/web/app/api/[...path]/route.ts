import { auth } from "@clerk/nextjs/server";

const API_BASE_URL = (process.env.API_INTERNAL_URL ?? "http://api:8000").replace(/\/$/, "");
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const internalApiSecret = process.env.INTERNAL_API_SECRET;

function toBackendPath(path: string[] | undefined) {
  return `/${(path ?? []).join("/")}`;
}

async function proxy(request: Request, path: string[] | undefined) {
  const isUpload = path?.[0] === "uploads";
  let userId: string;

  if (clerkPublishableKey && !isUpload) {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return Response.json({ detail: "Unauthorized" }, { status: 401 });
    }
    userId = clerkUserId;
  } else {
    userId = "dev-user";
  }

  const url = new URL(request.url);
  const backendUrl = `${API_BASE_URL}${toBackendPath(path)}${url.search}`;

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const contentType = request.headers.get("content-type") ?? "";

  // Multipart bodies must be forwarded as raw bytes to preserve the boundary.
  // JSON and text bodies are safe to read as text.
  const body = hasBody
    ? contentType.includes("multipart/form-data") || contentType.includes("application/octet-stream")
      ? await request.arrayBuffer()
      : await request.text()
    : undefined;

  const forwardHeaders: Record<string, string> = {
    "x-clerk-user-id": userId,
  };

  if (contentType) forwardHeaders["content-type"] = contentType;
  if (internalApiSecret) forwardHeaders["x-internal-secret"] = internalApiSecret;

  const clerkEmail = request.headers.get("x-clerk-user-email");
  if (clerkEmail) forwardHeaders["x-clerk-user-email"] = clerkEmail;

  const response = await fetch(backendUrl, {
    method: request.method,
    headers: forwardHeaders,
    body,
  });

  // Node fetch auto-decompresses the body, but the original content-length and
  // content-encoding headers reflect the compressed size/encoding. Fully buffer
  // the body so the browser gets correct data with no length mismatch — piping
  // the raw stream causes iOS Safari to truncate and fail to parse JSON.
  const responseBody = response.status === 204 ? null : await response.arrayBuffer();

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");
  responseHeaders.delete("content-length"); // recalculated from buffered body

  return new Response(responseBody, {
    status: response.status,
    headers: responseHeaders,
  });
}

export async function GET(request: Request, context: { params: { path?: string[] } }) {
  return proxy(request, context.params.path);
}

export async function POST(request: Request, context: { params: { path?: string[] } }) {
  return proxy(request, context.params.path);
}

export async function PUT(request: Request, context: { params: { path?: string[] } }) {
  return proxy(request, context.params.path);
}

export async function DELETE(request: Request, context: { params: { path?: string[] } }) {
  return proxy(request, context.params.path);
}

export async function PATCH(request: Request, context: { params: { path?: string[] } }) {
  return proxy(request, context.params.path);
}
