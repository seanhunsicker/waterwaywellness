import { useEffect, useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { X, Tag } from "lucide-react";

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

  // Discount code entry (kept outside Stripe's form so custom codes like ZINGO work)
  const [appliedPromo, setAppliedPromo] = useState<{ id: string; code: string; label?: string } | null>(
    promoCodeId ? { id: promoCodeId, code: promoCodeId === "ZINGO_AT_COST" ? "ZINGO" : promoCodeId } : null
  );
  const [codeInput, setCodeInput] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [showCodeInput, setShowCodeInput] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const p = getStripe();
    setStripeReady(p);
    p.catch(() => setError("Could not load payment processor."));
  }, []);

  const activePromoId = appliedPromo?.id;

  const fetchClientSecret = useCallback(async () => {
    const resp = await fetch("/api/checkout/embedded-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, promoCodeId: activePromoId }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error ?? "Checkout failed");
    setClientSecret(data.clientSecret);
    return data.clientSecret;
  }, [items, activePromoId]);

  useEffect(() => {
    setClientSecret(null);
    fetchClientSecret().catch((err) => setError(err.message));
  }, [fetchClientSecret]);

  async function applyCode() {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setCodeLoading(true);
    setCodeError(null);
    try {
      const resp = await fetch(`/api/checkout/validate-coupon?code=${encodeURIComponent(code)}`);
      const data = await resp.json();
      if (!resp.ok || !data.valid) {
        setCodeError(data.error ?? "Invalid or expired code");
      } else {
        setAppliedPromo({ id: data.id, code: data.code, label: data.label });
        setCodeInput("");
        setShowCodeInput(false);
      }
    } catch {
      setCodeError("Could not validate code. Try again.");
    } finally {
      setCodeLoading(false);
    }
  }

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

        {/* Discount code — applies before the payment form loads */}
        <div className="px-6 py-3 border-b border-gray-100 shrink-0 bg-gray-50">
          {appliedPromo ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-sm text-gray-800 truncate">
                  <span className="font-bold">{appliedPromo.code}</span>
                  {appliedPromo.label ? ` — ${appliedPromo.label}` : " applied"}
                </p>
              </div>
              <button
                onClick={() => setAppliedPromo(null)}
                className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
              >
                Remove
              </button>
            </div>
          ) : showCodeInput ? (
            <div>
              <div className="flex gap-2">
                <input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyCode()}
                  placeholder="Discount code"
                  autoFocus
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={applyCode}
                  disabled={codeLoading}
                  className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {codeLoading ? "…" : "Apply"}
                </button>
              </div>
              {codeError && <p className="text-xs text-red-500 mt-1.5">{codeError}</p>}
            </div>
          ) : (
            <button
              onClick={() => setShowCodeInput(true)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <Tag className="w-4 h-4" />
              Have a discount code?
            </button>
          )}
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
              key={clientSecret}
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
