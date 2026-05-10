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

      {/* Teal edge vignette — bleeds in from all sides */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 75% 70% at 50% 45%, transparent 40%, rgba(52,153,128,0.55) 100%)",
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
