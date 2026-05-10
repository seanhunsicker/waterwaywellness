const HERO_PHOTO = "/community/photo6.jpg";

export function RotatingHeroBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">

      {/* Hero photo with Ken Burns zoom */}
      <div
        className="absolute inset-0"
        style={{ animation: "kbZoomIn 18000ms ease-out both infinite alternate" }}
      >
        <img
          src={HERO_PHOTO}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.75) saturate(1.1)" }}
        />
      </div>

      {/* Radial vignette — darkens edges, keeps centre open */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 40%, transparent 25%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Bottom fade to page background */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{ height: "55%", background: "linear-gradient(to bottom, transparent, hsl(var(--background)) 90%)" }}
      />

      {/* Top fade for nav legibility */}
      <div
        className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{ height: "180px", background: "linear-gradient(to bottom, rgba(0,0,0,0.45), transparent)" }}
      />

      {/* Subtle overall dark tint */}
      <div className="absolute inset-0 z-10 bg-black/15 pointer-events-none" />
    </div>
  );
}
