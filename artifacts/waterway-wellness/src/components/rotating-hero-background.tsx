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

// Fallback community photo slideshow used until video clips are added
const FALLBACK_PHOTOS = [
  "/community/photo9.jpg",
  "/community/photo0.jpg",
  "/community/photo6.jpg",
  "/community/photo10.jpg",
  "/community/photo2.jpg",
  "/community/photo11.jpg",
];

const INTERVAL_MS = 4500;
const FADE_MS = 900;

export function RotatingHeroBackground() {
  const useVideos = HERO_VIDEOS.length > 0;
  const clips = useVideos ? HERO_VIDEOS : FALLBACK_PHOTOS;

  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(clips.length - 1);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setPrev(current);
        setCurrent((i) => (i + 1) % clips.length);
        setTransitioning(false);
      }, FADE_MS);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [current, clips.length]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Previous clip — always visible beneath */}
      <ClipLayer src={clips[prev]} isVideo={useVideos} opacity={50} className="z-0" />

      {/* Current clip — fades in over previous */}
      <ClipLayer
        src={clips[current]}
        isVideo={useVideos}
        opacity={50}
        className={`z-10 transition-opacity duration-[900ms] ${transitioning ? "opacity-0" : "opacity-50"}`}
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 z-20 bg-gradient-to-b from-background/50 via-background/70 to-background" />
    </div>
  );
}

interface ClipLayerProps {
  src: string;
  isVideo: boolean;
  opacity: number;
  className?: string;
}

function ClipLayer({ src, isVideo, className = "" }: ClipLayerProps) {
  if (isVideo) {
    return (
      <video
        key={src}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        className={`absolute inset-0 w-full h-full object-cover ${className}`}
      />
    );
  }
  return (
    <img
      key={src}
      src={src}
      alt=""
      className={`absolute inset-0 w-full h-full object-cover ${className}`}
    />
  );
}
