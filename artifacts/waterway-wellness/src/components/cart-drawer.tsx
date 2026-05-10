import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/context/cart";
import { CheckoutModal } from "@/components/checkout-modal";

export function CartDrawer() {
  const { items, count, removeItem, updateQty, clearCart, isOpen, closeCart } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  function handleCheckout() {
    if (items.length === 0) return;
    setCheckingOut(true);
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={closeCart}
            />
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 bottom-0 z-[61] w-full max-w-sm bg-[#0f1a14] border-l border-white/10 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <span className="font-bold text-foreground">Cart</span>
                  {count > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </div>
                <button
                  onClick={closeCart}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
                    <ShoppingBag className="w-12 h-12 text-white/20" />
                    <p className="text-foreground/50 text-sm">Your cart is empty.</p>
                    <button
                      onClick={closeCart}
                      className="text-primary text-sm font-bold hover:opacity-80 transition-opacity"
                    >
                      Continue Shopping →
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y divide-white/10">
                    {items.map((item) => (
                      <li key={`${item.product_id}-${item.variant_id}`} className="flex gap-4 p-5">
                        {item.image && (
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/30 shrink-0">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-foreground leading-tight truncate">{item.title}</p>
                          {item.variantTitle && (
                            <p className="text-xs text-foreground/50 mt-0.5">{item.variantTitle}</p>
                          )}
                          <p className="text-primary font-bold text-sm mt-1">
                            ${((item.price * item.quantity) / 100).toFixed(2)}
                          </p>
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1">
                              <button
                                onClick={() => updateQty(item.product_id, item.variant_id, item.quantity - 1)}
                                className="w-5 h-5 flex items-center justify-center hover:text-primary transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQty(item.product_id, item.variant_id, item.quantity + 1)}
                                className="w-5 h-5 flex items-center justify-center hover:text-primary transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeItem(item.product_id, item.variant_id)}
                              className="text-foreground/30 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {items.length > 0 && (
                <div className="border-t border-white/10 p-6 space-y-4 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/60 text-sm">Subtotal</span>
                    <span className="font-bold text-foreground">${(subtotal / 100).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-foreground/40">Shipping calculated at checkout</p>
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl transition-all active:scale-95 text-sm"
                  >
                    Checkout ({count} {count === 1 ? "item" : "items"})
                  </button>
                  <button
                    onClick={clearCart}
                    className="w-full text-foreground/40 hover:text-foreground/70 text-xs transition-colors"
                  >
                    Clear cart
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {checkingOut && (
        <CheckoutModal
          items={items.map(i => ({ product_id: i.product_id, variant_id: i.variant_id, quantity: i.quantity }))}
          onClose={() => setCheckingOut(false)}
        />
      )}
    </>
  );
}
