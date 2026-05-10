const HERO_PHOTO = "/community/photo9.jpg";

export function RotatingHeroBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">

      {/* Hero photo — static, no Ken Burns */}
      <img
        src={HERO_PHOTO}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.88) saturate(1.15)" }}
      />

      {/* Teal color wash */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 60%, rgba(82,183,157,0.12) 0%, transparent 70%)" }}
      />

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

      {/* Top fade for nav legibility */}
      <div
        className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{ height: "140px", background: "linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)" }}
      />
    </div>
  );
}
