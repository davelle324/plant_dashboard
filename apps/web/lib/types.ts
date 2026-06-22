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
  created_at: string;
};

