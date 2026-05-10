const HERO_IMAGE = "/web-header-3.png";

export function RotatingHeroBackground() {
  return (
    <div className="relative w-full">
      <img
        src={HERO_IMAGE}
        alt="Waterway Wellness Run Club"
        className="w-full h-auto block"
      />
      {/* Bottom fade into page background */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{ height: "35%", background: "linear-gradient(to bottom, transparent, hsl(var(--background)) 98%)" }}
      />
    </div>
  );
}
