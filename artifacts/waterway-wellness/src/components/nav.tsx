import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X } from "lucide-react";
import wwOutline from "@assets/WaterwayWellness_WWOutline_Seafoam_1778255372780.png";
import { useCart } from "@/context/cart";
import { ScrollProgress } from "@/components/scroll-progress";

const NAV_LINKS = [
  { label: "Who We Are", href: "#about", isAnchor: true },
  { label: "When & Where", href: "#details", isAnchor: true },
  { label: "The Movement", href: "#movement", isAnchor: true },
  { label: "Shop", href: "/shop", isAnchor: false },
];

export function Nav() {
  const { count, openCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleAnchorClick(href: string) {
    setMobileOpen(false);
    setTimeout(() => {
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  return (
    <>
      <ScrollProgress />

      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 px-5 py-3.5 grid grid-cols-3 items-center bg-background/90 backdrop-blur-md border-b border-white/5"
      >
        {/* Logo — left */}
        <Link href="/" className="flex items-center z-10" data-testid="link-home" onClick={() => setMobileOpen(false)}>
          <img src={wwOutline} alt="Waterway Wellness Logo" className="h-8 w-auto" />
        </Link>

        {/* Desktop links — truly centered */}
        <div className="hidden md:flex items-center justify-center gap-8 text-sm font-medium tracking-wide">
          {NAV_LINKS.map((l) =>
            l.isAnchor ? (
              <a key={l.label} href={l.href} className="text-foreground/80 hover:text-primary transition-colors">
                {l.label}
              </a>
            ) : (
              <Link key={l.label} href={l.href} className="text-foreground/80 hover:text-primary transition-colors" data-testid="link-nav-shop">
                {l.label}
              </Link>
            )
          )}
        </div>

        {/* Spacer on mobile so right side stays right */}
        <div className="md:hidden" />

        {/* Right side */}
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={openCart}
            className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Open cart"
            data-testid="btn-cart"
          >
            <ShoppingBag className="w-5 h-5 text-foreground/80" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>

          {/* Desktop Join Us */}
          <a
            href="https://instagram.com/waterway.wellness"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-bold tracking-wide hover:bg-primary/90 transition-colors"
            data-testid="link-nav-join"
          >
            Join Us
          </a>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile full-screen menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-background/98 backdrop-blur-xl flex flex-col pt-24 px-8 pb-12 md:hidden"
          >
            {/* Nav links */}
            <nav className="flex flex-col gap-1 flex-1">
              {NAV_LINKS.map((l, i) =>
                l.isAnchor ? (
                  <motion.button
                    key={l.label}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.25 }}
                    onClick={() => handleAnchorClick(l.href)}
                    className="text-left text-3xl font-bold text-foreground/80 hover:text-primary transition-colors py-4 border-b border-white/5"
                  >
                    {l.label}
                  </motion.button>
                ) : (
                  <motion.div
                    key={l.label}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.25 }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setMobileOpen(false)}
                      className="block text-3xl font-bold text-foreground/80 hover:text-primary transition-colors py-4 border-b border-white/5"
                    >
                      {l.label}
                    </Link>
                  </motion.div>
                )
              )}
            </nav>

            {/* Bottom CTA */}
            <motion.a
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.3 }}
              href="https://instagram.com/waterway.wellness"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="w-full bg-primary text-primary-foreground text-center py-5 rounded-2xl text-lg font-bold tracking-wide"
            >
              Join Us on Instagram
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
