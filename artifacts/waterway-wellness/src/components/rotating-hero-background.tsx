const HERO_IMAGE = "/web-header-3.png";

export function RotatingHeroBackground() {
  return (
    <div className="relative w-full">
      {/* Mobile: fixed height so the wordmark reads large; desktop: natural width */}
      <div className="relative w-full h-[55vw] min-h-[260px] md:h-auto md:min-h-0 overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="Waterway Wellness Run Club"
          /* Mobile: cover + center so the big wordmark fills the frame */
          /* Desktop: natural size, no cropping */
          className="block w-full h-full object-cover object-center md:h-auto md:object-none"
        />
      </div>

      {/* Bottom fade into page background */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{ height: "35%", background: "linear-gradient(to bottom, transparent, hsl(var(--background)) 98%)" }}
      />
    </div>
  );
}
