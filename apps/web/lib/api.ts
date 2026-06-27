import type { Analytics, FeedItem, LogEntry, Photo, PhotoWithPlant, Plant, PublicUser, Reminder } from "./types";

const API_BASE_URL = typeof window === "undefined" ? (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000") : "";

export type PlantInput = {
  name: string;
  species: string;
  location: string;
  watering_interval_days: number;
};

export type LogInput = {
  plant_id: number;
  type: LogEntry["type"];
  note?: string;
  created_at?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseHeaders: Record<string, string> = {};

  if (typeof init?.body === "string") baseHeaders["Content-Type"] = "application/json";

  // Server-side: forward the incoming request's cookies so Clerk's session
  // cookie reaches the /api/[...path] route handler and auth() returns a userId.
  // (Node.js fetch ignores `credentials: "include"` — cookies must be explicit.)
  if (typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const store = cookies();
      const cookieHeader = store.getAll().map(c => `${c.name}=${c.value}`).join("; ");
      if (cookieHeader) baseHeaders["Cookie"] = cookieHeader;
    } catch {
      // Not in a request context (e.g. during build) — skip
    }
  }

  const headers = { ...baseHeaders, ...(init?.headers as Record<string, string> ?? {}) };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    credentials: "include",
    ...init,
    headers,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `API request failed: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getPlants() {
  return request<Plant[]>("/api/plants");
}

export function getPlant(id: string) {
  return request<Plant>(`/api/plants/${id}`);
}

export function getPlantLogs(id: string) {
  return request<LogEntry[]>(`/api/plants/${id}/logs`);
}

export function getReminders() {
  return request<Reminder[]>("/api/reminders");
}

export function getAllReminders() {
  return request<Reminder[]>("/api/reminders?all=true");
}

export function createPlant(payload: PlantInput) {
  return request<Plant>("/api/plants", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updatePlant(id: number, payload: PlantInput) {
  return request<Plant>(`/api/plants/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deletePlant(id: number) {
  return request<void>(`/api/plants/${id}`, {
    method: "DELETE"
  });
}

export function createLog(payload: LogInput) {
  return request<LogEntry>("/api/logs", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateLog(id: number, payload: LogInput) {
  return request<LogEntry>(`/api/logs/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteLog(id: number) {
  return request<void>(`/api/logs/${id}`, {
    method: "DELETE"
  });
}

// Photos — multipart upload, so we pass FormData directly (no Content-Type override)
export function getPhotos(plantId: number) {
  return request<Photo[]>(`/api/plants/${plantId}/photos`);
}

export function uploadPhoto(plantId: number, file: File, caption?: string) {
  const form = new FormData();
  form.append("file", file);
  if (caption?.trim()) form.append("caption", caption.trim());
  return request<Photo>(`/api/plants/${plantId}/photos`, {
    method: "POST",
    body: form as unknown as BodyInit,
  });
}

export function getAllPhotos() {
  return request<PhotoWithPlant[]>("/api/photos");
}

export function deletePhoto(photoId: number) {
  return request<void>(`/api/photos/${photoId}`, { method: "DELETE" });
}

export function updatePhotoCaption(photoId: number, caption: string | null) {
  return request<Photo>(`/api/photos/${photoId}`, {
    method: "PATCH",
    body: JSON.stringify({ caption }),
  });
}

export function getAnalytics() {
  return request<Analytics>("/api/analytics");
}

// AI
export function askAI(plantId: number, question: string) {
  return request<{ answer: string }>("/api/ai/ask", {
    method: "POST",
    body: JSON.stringify({ plant_id: plantId, question })
  });
}

// Social — following, feed, profiles
export function getFeed() {
  return request<FeedItem[]>("/api/feed");
}

export function discoverUsers(q?: string) {
  const qs = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  return request<PublicUser[]>(`/api/users${qs}`);
}

export function getUserProfile(userId: number | string) {
  return request<PublicUser>(`/api/users/${userId}`);
}

export function getUserGallery(userId: number | string) {
  return request<PhotoWithPlant[]>(`/api/users/${userId}/gallery`);
}

export function followUser(userId: number) {
  return request<void>(`/api/users/${userId}/follow`, { method: "POST" });
}

export function unfollowUser(userId: number) {
  return request<void>(`/api/users/${userId}/follow`, { method: "DELETE" });
}
