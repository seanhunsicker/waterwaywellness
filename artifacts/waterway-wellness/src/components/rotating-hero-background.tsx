import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// ADD YOUR INSTAGRAM VIDEO CLIPS HERE
// Download clips from your Instagram posts (⋮ → Download) and upload them,
// then add their paths here like: "/hero-videos/clip1.mp4"
// ─────────────────────────────────────────────────────────────────────────────
const HERO_VIDEOS: string[] = [
  // "/hero-videos/clip1.mp4",
  // "/hero-videos/clip2.mp4",
  // "/hero-videos/clip3.mp4",
];

// Only real candid community shots — no event flyers or promotional templates
const FALLBACK_PHOTOS = [
  "/community/photo1.jpg",
  "/community/photo2.jpg",
  "/community/photo6.jpg",
  "/community/photo9.jpg",
  "/community/photo10.jpg",
];

// Cycle through different Ken Burns directions for visual variety
const KB_ANIMS = ["kbZoomIn", "kbPanRight", "kbZoomOut", "kbZoomIn", "kbPanRight"];

const DISPLAY_MS = 5500;
const FADE_MS = 1200;

export function RotatingHeroBackground() {
  const useVideos = HERO_VIDEOS.length > 0;
  const clips = useVideos ? HERO_VIDEOS : FALLBACK_PHOTOS;

  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(clips.length - 1);
  const [transitioning, setTransitioning] = useState(false);
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setPrev(current);
        setCurrent((i) => (i + 1) % clips.length);
        setEpoch((e) => e + 1);
        setTransitioning(false);
      }, FADE_MS);
    }, DISPLAY_MS);
    return () => clearInterval(timer);
  }, [current, clips.length]);

  const totalMs = DISPLAY_MS + FADE_MS;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">

      {/* Previous photo — underneath, keeps its Ken Burns going */}
      <div
        className="absolute inset-0 z-0"
        style={{ animation: `${KB_ANIMS[(epoch - 1 + KB_ANIMS.length) % KB_ANIMS.length]} ${totalMs}ms ease-out both` }}
      >
        <img
          src={clips[prev]}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.75) saturate(1.1)" }}
        />
      </div>

      {/* Current photo — fades in with fresh Ken Burns */}
      <div
        key={epoch}
        className={`absolute inset-0 z-10 transition-opacity ease-in-out ${transitioning ? "opacity-0" : "opacity-100"}`}
        style={{
          transitionDuration: `${FADE_MS}ms`,
          animation: `${KB_ANIMS[epoch % KB_ANIMS.length]} ${totalMs}ms ease-out both`,
        }}
      >
        <img
          src={clips[current]}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.75) saturate(1.1)" }}
        />
      </div>

      {/* ── Layered cinematic overlays ─────────────────────────────────────── */}

      {/* 1. Radial vignette — darkens edges, keeps centre open */}
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 40%, transparent 25%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* 2. Bottom fade to page background */}
      <div
        className="absolute inset-x-0 bottom-0 z-20 pointer-events-none"
        style={{ height: "55%", background: "linear-gradient(to bottom, transparent, hsl(var(--background)) 90%)" }}
      />

      {/* 3. Top fade for nav legibility */}
      <div
        className="absolute inset-x-0 top-0 z-20 pointer-events-none"
        style={{ height: "180px", background: "linear-gradient(to bottom, rgba(0,0,0,0.45), transparent)" }}
      />

      {/* 4. Subtle overall dark tint */}
      <div className="absolute inset-0 z-20 bg-black/15 pointer-events-none" />
    </div>
  );
}
