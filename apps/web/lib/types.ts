export type Plant = {
  id: number;
  user_id: number;
  name: string;
  species: string;
  location: string;
  watering_interval_days: number;
  created_at: string;
  latest_photo?: Photo;
};

export type LogEntry = {
  id: number;
  plant_id: number;
  type: "watering" | "pruning" | "fertilizing" | "notes";
  note: string | null;
  created_at: string;
};

export type Photo = {
  id: number;
  plant_id: number;
  filename: string;
  caption?: string | null;
  created_at: string;
};

export type PhotoWithPlant = Photo & { plant_name: string };

export type WateringInterval = {
  date: string;
  days: number;
};

export type PlantStat = {
  plant_id: number;
  plant_name: string;
  total_logs: number;
  watering_count: number;
  days_since_last_watered: number | null;
  avg_days_between_waterings: number | null;
  watering_intervals: WateringInterval[];
};

export type Reminder = {
  plant_id: number;
  plant_name: string;
  days_since_last_care: number;
  overdue: boolean;
  due_in_days: number;
};

export type Analytics = {
  total_plants: number;
  total_logs: number;
  total_photos: number;
  logs_by_type: Record<string, number>;
  activity_by_week: { week: string; count: number }[];
  plant_stats: PlantStat[];
};

export type PublicUser = {
  id: number;
  display_name: string;
  plant_count: number;
  photo_count: number;
  follower_count: number;
  following_count: number;
  is_following: boolean;
  is_self: boolean;
};

export type FeedItem = {
  id: number;
  plant_id: number;
  filename: string;
  caption: string | null;
  created_at: string;
  plant_name: string;
  owner_id: number;
  owner_display_name: string;
};

