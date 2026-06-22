import type { LogEntry, Photo, Plant } from "./types";

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

type Reminder = {
  plant_id: number;
  plant_name: string;
  days_since_last_care: number;
  overdue: boolean;
  due_in_days: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = init?.body
    ? { "Content-Type": "application/json", ...(init?.headers ?? {}) }
    : init?.headers;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    credentials: "include",
    headers,
    ...init
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

export function uploadPhoto(plantId: number, file: File) {
  const form = new FormData();
  form.append("file", file);
  return request<Photo>(`/api/plants/${plantId}/photos`, {
    method: "POST",
    body: form as unknown as BodyInit,
    // No Content-Type — browser sets it automatically with the correct boundary
    headers: {}
  });
}

export function deletePhoto(photoId: number) {
  return request<void>(`/api/photos/${photoId}`, { method: "DELETE" });
}

// AI
export function askAI(plantId: number, question: string) {
  return request<{ answer: string }>("/api/ai/ask", {
    method: "POST",
    body: JSON.stringify({ plant_id: plantId, question })
  });
}
