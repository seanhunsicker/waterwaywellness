import { useEffect, useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { X } from "lucide-react";

interface CheckoutModalProps {
  items: Array<{ product_id: string; variant_id: number; quantity: number }>;
  promoCodeId?: string;
  onClose: () => void;
}

let stripePromise: ReturnType<typeof loadStripe> | null = null;

async function getStripe() {
  if (!stripePromise) {
    const resp = await fetch("/api/checkout/config");
    const { publishableKey } = await resp.json();
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

export function CheckoutModal({ items, promoCodeId, onClose }: CheckoutModalProps) {
  const [stripeReady, setStripeReady] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const p = getStripe();
    setStripeReady(p);
    p.catch(() => setError("Could not load payment processor."));
  }, []);

  const fetchClientSecret = useCallback(async () => {
    const resp = await fetch("/api/checkout/embedded-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, promoCodeId }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error ?? "Checkout failed");
    setClientSecret(data.clientSecret);
    return data.clientSecret;
  }, [items, promoCodeId]);

  useEffect(() => {
    fetchClientSecret().catch((err) => setError(err.message));
  }, [fetchClientSecret]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full md:max-w-xl max-h-[92dvh] bg-white rounded-t-3xl md:rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <p className="font-bold text-gray-900 text-sm">Secure Checkout</p>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {error ? (
            <div className="p-8 text-center text-red-500 text-sm">{error}</div>
          ) : !clientSecret || !stripeReady ? (
            <div className="p-12 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Preparing checkout…</p>
            </div>
          ) : (
            <EmbeddedCheckoutProvider
              stripe={stripeReady}
              options={{ clientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </div>
      </div>
    </div>
  );
}
