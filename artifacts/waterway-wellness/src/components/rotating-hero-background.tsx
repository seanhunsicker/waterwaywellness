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
          style={{ filter: "brightness(1.0) saturate(1.25) contrast(1.05)" }}
        />
      </div>

      {/* Subtle teal color wash — adds brand warmth without darkening */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 60%, rgba(82,183,157,0.08) 0%, transparent 70%)" }}
      />

      {/* Radial vignette — very subtle, only darkens extreme edges */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 90% at 50% 40%, transparent 45%, rgba(0,0,0,0.25) 100%)",
        }}
      />

      {/* Bottom fade to page background */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{ height: "35%", background: "linear-gradient(to bottom, transparent, hsl(var(--background)) 98%)" }}
      />

      {/* Top fade for nav legibility */}
      <div
        className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{ height: "120px", background: "linear-gradient(to bottom, rgba(0,0,0,0.25), transparent)" }}
      />
    </div>
  );
}
