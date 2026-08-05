import { PlatformId } from "@/types";

/** Guess the platform from a pasted post URL (patterns ported from the Zingo tracker). */
export function detectPlatform(url: string): PlatformId {
  const u = url.toLowerCase();
  if (/tiktok\./.test(u)) return "tiktok";
  if (/youtu\.be\/|youtube\./.test(u)) return "youtube";
  if (/instagram\./.test(u)) return "instagram";
  if (/facebook\.|fb\.watch/.test(u)) return "facebook";
  if (/twitter\.|(^|\/\/|\.)x\.com/.test(u)) return "x";
  return "other";
}

export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.href;
  } catch {
    return null;
  }
}
