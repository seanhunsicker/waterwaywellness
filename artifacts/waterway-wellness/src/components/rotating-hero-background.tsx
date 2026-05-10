const HERO_PHOTO = "/community/photo1.jpg";

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
          style={{ filter: "brightness(0.88) saturate(1.15)" }}
        />
      </div>

      {/* Radial vignette — subtle, just darkens far edges */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 95% 85% at 50% 40%, transparent 35%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      {/* Bottom fade to page background */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{ height: "40%", background: "linear-gradient(to bottom, transparent, hsl(var(--background)) 95%)" }}
      />

      {/* Top fade for nav legibility — lighter */}
      <div
        className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{ height: "140px", background: "linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)" }}
      />
    </div>
  );
}
