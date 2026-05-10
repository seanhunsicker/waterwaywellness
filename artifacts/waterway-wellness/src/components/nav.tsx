import { Link } from "wouter";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import wwOutline from "@assets/WaterwayWellness_WWOutline_Seafoam_1778255372780.png";
import { useCart } from "@/context/cart";
import { ScrollProgress } from "@/components/scroll-progress";

export function Nav() {
  const { count, openCart } = useCart();

  return (
    <>
      <ScrollProgress />
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-background/80 backdrop-blur-md border-b border-white/5"
      >
        <Link href="/" className="flex items-center gap-2 z-10" data-testid="link-home">
          <img src={wwOutline} alt="Waterway Wellness Logo" className="h-8 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
          <a href="#about" className="text-foreground/80 hover:text-primary transition-colors" data-testid="link-nav-about">Who We Are</a>
          <a href="#details" className="text-foreground/80 hover:text-primary transition-colors" data-testid="link-nav-details">When & Where</a>
          <a href="#movement" className="text-foreground/80 hover:text-primary transition-colors" data-testid="link-nav-movement">The Movement</a>
          <Link href="/shop" className="text-foreground/80 hover:text-primary transition-colors" data-testid="link-nav-shop">Shop</Link>
        </div>

        <div className="flex items-center gap-3">
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
          <a
            href="https://instagram.com/waterway.wellness"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-bold tracking-wide hover:bg-primary/90 transition-colors"
            data-testid="link-nav-join"
          >
            Join Us
          </a>
        </div>
      </motion.nav>
    </>
  );
}
