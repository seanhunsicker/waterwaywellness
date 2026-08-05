export const PILLARS = [
  { id: "golf", label: "Golf", tint: "#C8E64A" },
  { id: "train", label: "Training", tint: "#FF7A45" },
  { id: "learn", label: "Learning", tint: "#4ACFE6" },
  { id: "crew", label: "Crew", tint: "#E64A9B" },
  { id: "ideas", label: "Ideas", tint: "#A98CFF" },
] as const;

export type PillarId = (typeof PILLARS)[number]["id"];

export const TAGS = [
  { id: "R", label: "Relatable" },
  { id: "V", label: "Valuable" },
  { id: "E", label: "Entertaining" },
] as const;

export type TagId = (typeof TAGS)[number]["id"];

export const STATUSES = ["captured", "filmed", "posted"] as const;

export type Status = (typeof STATUSES)[number];

export type Heat = 0 | 1 | 2 | 3;

export interface Line {
  id: string;
  text: string;
  pillar: PillarId;
  tag: TagId;
  status: Status;
  heat: Heat;
  createdAt: number;
  filmedAt?: number;
  postedAt?: number;
}

export type StatusFilter = "all" | Status;

export type SortMode = "new" | "hot";

export function pillarOf(id: string) {
  return PILLARS.find((p) => p.id === id) ?? PILLARS[0];
}

export function tagOf(id: string) {
  return TAGS.find((t) => t.id === id) ?? TAGS[0];
}
