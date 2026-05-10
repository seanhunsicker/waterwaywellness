import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Nav } from "@/components/nav";
import { CheckoutModal } from "@/components/checkout-modal";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

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

export default function ShopProduct() {
  const { productId } = useParams<{ productId: string }>();
  // Only tracks options the user has explicitly picked
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [activeImage, setActiveImage] = useState(0);
  const [checkoutItems, setCheckoutItems] = useState<Array<{ product_id: string; variant_id: number; quantity: number }> | null>(null);

  const { data, isLoading: fetching, error } = useQuery<{ data: PrintifyProduct }>({
    queryKey: ["printify-product", productId],
    queryFn: async () => {
      const resp = await fetch(`/api/printify/products/${productId}`);
      if (!resp.ok) throw new Error("Product not found");
      return resp.json();
    },
  });

  const product = data?.data;
  const enabledVariants = product?.variants.filter((v) => v.is_enabled && v.is_available) ?? [];

  // Find the variant that matches all explicitly selected options
  const selectedVariant = product
    ? enabledVariants.find((v) =>
        product.options.every((_, i) => {
          const chosen = selectedOptions[i];
          return chosen === undefined || v.options[i] === chosen;
        })
      ) ?? null
    : null;

  // All required option types the user must pick (e.g. size, color)
  const allOptionsPicked = product
    ? product.options.every((_, i) => selectedOptions[i] !== undefined)
    : false;

  const price = selectedVariant
    ? formatPrice(selectedVariant.price)
    : enabledVariants[0]
    ? formatPrice(enabledVariants[0].price)
    : "—";

  const images = product?.images ?? [];
  const currentImage = images[activeImage]?.src ?? images[0]?.src ?? "";

  // Which option values are still available given current selections
  function isValueAvailable(optionIndex: number, valueId: number): boolean {
    return enabledVariants.some((v) => {
      if (v.options[optionIndex] !== valueId) return false;
      return product!.options.every((_, i) => {
        if (i === optionIndex) return true;
        const chosen = selectedOptions[i];
        return chosen === undefined || v.options[i] === chosen;
      });
    });
  }

  function selectOption(optionIndex: number, valueId: number) {
    const newOptions = { ...selectedOptions, [optionIndex]: valueId };
    setSelectedOptions(newOptions);

    // Update preview image if a matching variant has a specific image
    const matched = enabledVariants.find((v) =>
      product!.options.every((_, i) => {
        const chosen = newOptions[i];
        return chosen === undefined || v.options[i] === chosen;
      })
    );
    if (matched) {
      const imgIdx = images.findIndex((img) => img.variant_ids.includes(matched.id));
      if (imgIdx >= 0) setActiveImage(imgIdx);
    }
  }

  // Find the size option index (if any) to show helpful prompt
  const sizeOptionIndex = product?.options.findIndex(
    (o) => o.name.toLowerCase() === "size"
  ) ?? -1;
  const sizeNotPicked = sizeOptionIndex >= 0 && selectedOptions[sizeOptionIndex] === undefined;

  function handleBuy() {
    if (!selectedVariant || !product || !allOptionsPicked) return;
    setCheckoutItems([{ product_id: product.id, variant_id: selectedVariant.id, quantity: 1 }]);
  }

  if (fetching) {
    return (
      <div className="dark min-h-screen bg-background text-foreground overflow-x-hidden">
        <Nav />
        <div className="pt-28 pb-24 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-white/10 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-white/10 rounded w-3/4" />
            <div className="h-6 bg-white/10 rounded w-1/4" />
            <div className="h-32 bg-white/10 rounded" />
            <div className="h-12 bg-white/10 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="dark min-h-screen bg-background text-foreground overflow-x-hidden">
        <Nav />
        <div className="pt-40 text-center">
          <p className="text-foreground/50 text-lg mb-6">Product not found.</p>
          <Link href="/shop" className="text-primary underline">Back to shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground overflow-x-hidden">
      <Nav />
      <main className="pt-24 pb-24 px-4 md:px-6 max-w-6xl mx-auto">
        <Link href="/shop" className="inline-flex items-center gap-1 text-foreground/50 hover:text-foreground transition-colors text-sm mb-8">
          <ChevronLeft className="w-4 h-4" />
          Back to shop
        </Link>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          {/* Left: images */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 mb-4">
              {currentImage && (
                <img
                  src={currentImage}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.slice(0, 8).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImage === i ? "border-primary" : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <img src={img.src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Right: details + options + CTA */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-6"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">{product.title}</h1>
              <p className="text-2xl font-bold text-primary">{price}</p>
            </div>

            {/* Option selectors */}
            {product.options.map((option, optionIndex) => {
              const notPicked = selectedOptions[optionIndex] === undefined;
              const isSize = option.name.toLowerCase() === "size";

              return (
                <div key={optionIndex}>
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs text-foreground/50 uppercase tracking-widest">{option.name}</p>
                    {notPicked && isSize && (
                      <span className="text-xs text-primary font-semibold animate-pulse">← pick one</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((val) => {
                      const available = isValueAvailable(optionIndex, val.id);
                      if (!available) return null;
                      const isSelected = selectedOptions[optionIndex] === val.id;

                      if (option.type === "color" || option.name.toLowerCase() === "color") {
                        return (
                          <button
                            key={val.id}
                            title={val.title}
                            onClick={() => selectOption(optionIndex, val.id)}
                            className={`w-9 h-9 rounded-full border-2 transition-all ${
                              isSelected ? "border-primary scale-110 ring-2 ring-primary/30" : "border-white/20 hover:border-white/50"
                            }`}
                            style={{ background: val.title.toLowerCase() }}
                          />
                        );
                      }

                      return (
                        <button
                          key={val.id}
                          onClick={() => selectOption(optionIndex, val.id)}
                          className={`px-4 py-2 rounded-lg text-sm border transition-all ${
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
              );
            })}

            {product.description && (
              <p
                className="text-foreground/60 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: product.description
                    .replace(/<br\s*\/?>/gi, "\n")
                    .replace(/<[^>]+>/g, "")
                    .replace(/&nbsp;/g, " ")
                    .replace(/&mdash;/g, "—")
                    .replace(/&ndash;/g, "–")
                    .replace(/&amp;/g, "&")
                    .replace(/&lt;/g, "<")
                    .replace(/&gt;/g, ">")
                    .replace(/&sup2;/g, "²")
                    .slice(0, 500),
                }}
              />
            )}

            <div className="mt-auto space-y-3">
              <button
                onClick={handleBuy}
                disabled={!allOptionsPicked || !selectedVariant}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground font-bold py-4 rounded-xl transition-all active:scale-95 text-lg"
              >
                {!allOptionsPicked
                  ? sizeNotPicked
                    ? "Select a size to continue"
                    : "Select options to continue"
                  : `Buy Now — ${price}`}
              </button>
              <p className="text-center text-xs text-foreground/40">
                Printed on demand · Ships in 5–10 business days
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {checkoutItems && (
        <CheckoutModal
          items={checkoutItems}
          onClose={() => setCheckoutItems(null)}
        />
      )}
    </div>
  );
}
