import { auth } from "@clerk/nextjs/server";

import type { Analytics, FeedItem, LogEntry, Photo, PhotoWithPlant, Plant, PublicUser, Reminder } from "./types";

const API_BASE_URL = process.env.API_INTERNAL_URL ?? "http://api:8000";

async function serverRequest<T>(path: string): Promise<T> {
  const { userId } = await auth();

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

export const getPlants = () => serverRequest<Plant[]>("/plants");
export const getPlant = (id: string) => serverRequest<Plant>(`/plants/${id}`);
export const getPlantLogs = (id: string) => serverRequest<LogEntry[]>(`/plants/${id}/logs`);
export const getPhotos = (plantId: number) => serverRequest<Photo[]>(`/plants/${plantId}/photos`);
export const getReminders = () => serverRequest<Reminder[]>("/reminders");
export const getAllReminders = () => serverRequest<Reminder[]>("/reminders?all=true");
export const getAllPhotos = () => serverRequest<PhotoWithPlant[]>("/photos");
export const getAnalytics = () => serverRequest<Analytics>("/analytics");
export const getFeed = () => serverRequest<FeedItem[]>("/feed");
export const discoverUsers = (q?: string) => {
  const qs = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  return serverRequest<PublicUser[]>(`/users${qs}`);
};
export const getUserProfile = (userId: number | string) => serverRequest<PublicUser>(`/users/${userId}`);
export const getUserGallery = (userId: number | string) => serverRequest<PhotoWithPlant[]>(`/users/${userId}/gallery`);
