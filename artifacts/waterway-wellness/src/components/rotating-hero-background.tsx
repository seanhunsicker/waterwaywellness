const HERO_IMAGE = "/web-header-3.png";

export function RotatingHeroBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <img
        src={HERO_IMAGE}
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Bottom fade to page background */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{ height: "30%", background: "linear-gradient(to bottom, transparent, hsl(var(--background)) 95%)" }}
      />
    </div>
  );
}
