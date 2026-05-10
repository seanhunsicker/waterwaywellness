import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface CartItem {
  product_id: string;
  variant_id: number;
  quantity: number;
  title: string;
  variantTitle: string;
  price: number;
  image: string;
}

export interface PromoCode {
  id: string;
  code: string;
  type?: "standard" | "at_cost";
  percentOff: number | null;
  amountOff: number | null;
  label?: string;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (product_id: string, variant_id: number) => void;
  updateQty: (product_id: string, variant_id: number, qty: number) => void;
  clearCart: () => void;
  promoCode: PromoCode | null;
  setPromoCode: (code: PromoCode | null) => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "ww-cart";

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);
  const [isOpen, setIsOpen] = useState(false);
  const [promoCode, setPromoCode] = useState<PromoCode | null>(null);

  useEffect(() => { save(items); }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === item.product_id && i.variant_id === item.variant_id);
      if (existing) {
        return prev.map(i =>
          i.product_id === item.product_id && i.variant_id === item.variant_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((product_id: string, variant_id: number) => {
    setItems(prev => prev.filter(i => !(i.product_id === product_id && i.variant_id === variant_id)));
  }, []);

  const updateQty = useCallback((product_id: string, variant_id: number, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => !(i.product_id === product_id && i.variant_id === variant_id)));
    } else {
      setItems(prev => prev.map(i =>
        i.product_id === product_id && i.variant_id === variant_id ? { ...i, quantity: qty } : i
      ));
    }
  }, []);

  const clearCart = useCallback(() => { setItems([]); setPromoCode(null); }, []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, addItem, removeItem, updateQty, clearCart, promoCode, setPromoCode, isOpen, openCart, closeCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
