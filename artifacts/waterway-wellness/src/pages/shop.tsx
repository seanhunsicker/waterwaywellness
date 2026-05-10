import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Nav } from "@/components/nav";
import { motion, AnimatePresence } from "framer-motion";

interface PrintifyVariant {
  id: number;
  title: string;
  price: number;
  is_enabled: boolean;
  is_available: boolean;
  options: number[];
}

interface PrintifyOption {
  name: string;
  type: string;
  values: { id: number; title: string }[];
}

interface PrintifyImage {
  src: string;
  variant_ids: number[];
  is_default: boolean;
  position: string;
}

interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  options: PrintifyOption[];
  variants: PrintifyVariant[];
  images: PrintifyImage[];
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function getDefaultImage(product: PrintifyProduct, variantId?: number): string {
  if (variantId) {
    const img = product.images.find((i) => i.variant_ids.includes(variantId));
    if (img) return img.src;
  }
  const def = product.images.find((i) => i.is_default) ?? product.images[0];
  return def?.src ?? "";
}

function ProductCard({ product }: { product: PrintifyProduct }) {
  const [selectedVariant, setSelectedVariant] = useState<PrintifyVariant | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const enabledVariants = product.variants.filter((v) => v.is_enabled && v.is_available);
  const defaultVariant = enabledVariants[0];
  const activeVariant = selectedVariant ?? defaultVariant;

  const currentImage = getDefaultImage(product, activeVariant?.id);
  const price = activeVariant ? formatPrice(activeVariant.price) : "—";

  function selectOption(optionIndex: number, valueId: number) {
    const newOptions = { ...selectedOptions, [optionIndex]: valueId };
    setSelectedOptions(newOptions);

    const matched = enabledVariants.find((v) =>
      product.options.every((_, i) => {
        const chosen = newOptions[i];
        return chosen === undefined || v.options[i] === chosen;
      })
    );
    if (matched) setSelectedVariant(matched);
  }

  async function handleBuy() {
    if (!activeVariant) return;
    setIsLoading(true);
    try {
      const resp = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ product_id: product.id, variant_id: activeVariant.id, quantity: 1 }],
        }),
      });
      const data = await resp.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Checkout failed. Please try again.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col group"
    >
      <Link href={`/shop/${product.id}`} className="block relative aspect-square overflow-hidden bg-black/20">
        {currentImage && (
          <img
            src={currentImage}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <span className="text-white font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 px-4 py-2 rounded-full">
            View Product
          </span>
        </div>
      </Link>

      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/shop/${product.id}`} className="font-bold text-lg leading-tight text-foreground hover:text-primary transition-colors">
            {product.title}
          </Link>
          <span className="text-primary font-bold text-lg shrink-0">{price}</span>
        </div>

        {product.options.map((option, optionIndex) => (
          <div key={optionIndex}>
            <p className="text-xs text-foreground/50 uppercase tracking-widest mb-2">{option.name}</p>
            <div className="flex flex-wrap gap-2">
              {option.values.map((val) => {
                const hasVariant = enabledVariants.some((v) => v.options[optionIndex] === val.id);
                if (!hasVariant) return null;
                const isSelected = selectedOptions[optionIndex] === val.id ||
                  (selectedOptions[optionIndex] === undefined && activeVariant?.options[optionIndex] === val.id);

                if (option.type === "color" || (option.name.toLowerCase() === "color")) {
                  return (
                    <button
                      key={val.id}
                      title={val.title}
                      onClick={() => selectOption(optionIndex, val.id)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        isSelected ? "border-primary scale-110" : "border-white/20 hover:border-white/50"
                      }`}
                      style={{ background: val.title.toLowerCase() }}
                    />
                  );
                }

                return (
                  <button
                    key={val.id}
                    onClick={() => selectOption(optionIndex, val.id)}
                    className={`px-3 py-1 rounded-lg text-sm border transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary font-semibold"
                        : "border-white/20 text-foreground/70 hover:border-primary/60 hover:text-foreground"
                    }`}
                  >
                    {val.title}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {product.description && (
          <div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
            >
              {isExpanded ? "Hide details ↑" : "See details ↓"}
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="text-sm text-foreground/60 mt-2 leading-relaxed overflow-hidden"
                  dangerouslySetInnerHTML={{
                    __html: product.description.replace(/<[^>]*>/g, "").slice(0, 300) + "...",
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        )}

        <button
          onClick={handleBuy}
          disabled={!activeVariant || isLoading}
          className="mt-auto w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold py-3 rounded-xl transition-all active:scale-95"
        >
          {isLoading ? "Redirecting…" : "Buy Now"}
        </button>
      </div>
    </motion.div>
  );
}

function ShopSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden animate-pulse">
          <div className="aspect-square bg-white/10" />
          <div className="p-5 space-y-3">
            <div className="h-5 bg-white/10 rounded w-3/4" />
            <div className="h-4 bg-white/10 rounded w-1/4" />
            <div className="flex gap-2">
              <div className="h-8 bg-white/10 rounded w-10" />
              <div className="h-8 bg-white/10 rounded w-10" />
              <div className="h-8 bg-white/10 rounded w-10" />
            </div>
            <div className="h-11 bg-white/10 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Shop() {
  const { data, isLoading, error } = useQuery<{ data: PrintifyProduct[] }>({
    queryKey: ["printify-products"],
    queryFn: async () => {
      const resp = await fetch("/api/printify/products");
      if (!resp.ok) throw new Error("Failed to load products");
      return resp.json();
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const products = data?.data ?? [];

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Nav />

      <main className="pt-28 pb-24 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="text-primary text-sm font-bold tracking-[0.2em] uppercase mb-3">
            Waterway Wellness
          </p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            The Merch
          </h1>
          <p className="text-foreground/50 text-lg max-w-md mx-auto">
            Rep the run. All orders printed and shipped on demand.
          </p>
        </motion.div>

        {isLoading && <ShopSkeleton />}

        {error && (
          <div className="text-center py-24">
            <p className="text-foreground/40 text-lg">
              {String(error).includes("credentials") || String(error).includes("PRINTIFY")
                ? "Store coming soon — check back shortly."
                : "Couldn't load products right now. Try again in a moment."}
            </p>
          </div>
        )}

        {!isLoading && !error && products.length === 0 && (
          <div className="text-center py-24">
            <p className="text-foreground/40 text-lg">No products available yet — stay tuned.</p>
          </div>
        )}

        {!isLoading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
