import type { Analytics, FeedItem, LogEntry, LogWithPlant, Photo, PhotoWithPlant, Plant, PublicPhotoItem, PublicUser, Reminder } from "./types";

const API_BASE_URL = (process.env.API_INTERNAL_URL ?? "http://api:8000").replace(/\/$/, "");

async function serverRequest<T>(path: string, userId: string | null): Promise<T> {
  const headers: Record<string, string> = {};
  if (userId) headers["x-clerk-user-id"] = userId;
  if (process.env.INTERNAL_API_SECRET) headers["x-internal-secret"] = process.env.INTERNAL_API_SECRET;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `API request failed: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const getPlants = (userId: string | null) => serverRequest<Plant[]>("/plants", userId);
export const getPlant = (id: string, userId: string | null) => serverRequest<Plant>(`/plants/${id}`, userId);
export const getPlantLogs = (id: string, userId: string | null) => serverRequest<LogEntry[]>(`/plants/${id}/logs`, userId);
export const getPhotos = (plantId: number, userId: string | null) => serverRequest<Photo[]>(`/plants/${plantId}/photos`, userId);
export const getReminders = (userId: string | null) => serverRequest<Reminder[]>("/reminders", userId);
export const getAllReminders = (userId: string | null) => serverRequest<Reminder[]>("/reminders?all=true", userId);
export const getAllPhotos = (userId: string | null) => serverRequest<PhotoWithPlant[]>("/photos", userId);
export const getAnalytics = (userId: string | null) => serverRequest<Analytics>("/analytics", userId);
export const getFeed = (userId: string | null) => serverRequest<FeedItem[]>("/feed", userId);
export const getRecentLogs = (userId: string | null, limit = 10) =>
  serverRequest<LogWithPlant[]>(`/logs?limit=${limit}`, userId);

export const getPublicPhotos = (limit = 12) =>
  serverRequest<PublicPhotoItem[]>(`/photos/public?limit=${limit}`, null);
export const discoverUsers = (userId: string | null, q?: string) => {
  const qs = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  return serverRequest<PublicUser[]>(`/users${qs}`, userId);
};
export const getUserProfile = (id: number | string, userId: string | null) => serverRequest<PublicUser>(`/users/${id}`, userId);
export const getUserGallery = (id: number | string, userId: string | null) => serverRequest<PhotoWithPlant[]>(`/users/${id}/gallery`, userId);
