export type PillarId = string;
export type TagId = string;

export interface PillarDef {
  id: PillarId;
  label: string;
  tint: string;
}

export interface TagDef {
  id: TagId;
  label: string;
}

export interface Config {
  eyebrow: string;
  heading: string;
  pillars: PillarDef[];
  tags: TagDef[];
}

/**
 * The only tints pillars may use. All five validated together for
 * colorblind-safe separation on the dark surface — which is why pillars
 * cap at five: a sixth mutually-distinguishable hue doesn't exist here.
 */
export const SWATCHES = ["#C8E64A", "#FF7A45", "#4ACFE6", "#E64A9B", "#A98CFF"] as const;

export const MAX_PILLARS = SWATCHES.length;
export const MAX_TAGS = 6;

export const DEFAULT_CONFIG: Config = {
  eyebrow: "Content pipeline",
  heading: "What happened today",
  pillars: [
    { id: "golf", label: "Golf", tint: "#C8E64A" },
    { id: "train", label: "Training", tint: "#FF7A45" },
    { id: "learn", label: "Learning", tint: "#4ACFE6" },
    { id: "crew", label: "Crew", tint: "#E64A9B" },
    { id: "ideas", label: "Ideas", tint: "#A98CFF" },
  ],
  tags: [
    { id: "R", label: "Relatable" },
    { id: "V", label: "Valuable" },
    { id: "E", label: "Entertaining" },
  ],
};

export const STATUSES = ["captured", "filmed", "posted"] as const;

export type Status = (typeof STATUSES)[number];

export type Heat = 0 | 1 | 2 | 3;

export interface Metrics {
  views?: number;
  likes?: number;
  comments?: number;
  updatedAt: number;
}

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
  metrics?: Metrics;
}

export type StatusFilter = "all" | Status;

export type SortMode = "new" | "hot" | "top";

export type View = "pipeline" | "insights" | "settings";

/** Neutral stand-in for lines whose pillar/tag was deleted from settings. */
const MISSING_PILLAR: PillarDef = { id: "?", label: "—", tint: "#6b7064" };
const MISSING_TAG: TagDef = { id: "?", label: "—" };

export function pillarOf(config: Config, id: string): PillarDef {
  return config.pillars.find((p) => p.id === id) ?? MISSING_PILLAR;
}

export function tagOf(config: Config, id: string): TagDef {
  return config.tags.find((t) => t.id === id) ?? MISSING_TAG;
}
