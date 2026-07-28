import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { printify } from "../lib/printify";
import { getUncachableStripeClient, getStripePublishableKey } from "../stripeClient";
import { db } from "@workspace/db";
import { ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

async function submitOrderToPrintify(stripeSessionId: string): Promise<void> {
  const stripe = await getUncachableStripeClient();

  const session = await stripe.checkout.sessions.retrieve(stripeSessionId, {
    expand: ["shipping_details", "customer_details"],
  }) as Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>> & {
    shipping_details?: {
      address?: { country?: string | null; state?: string | null; line1?: string | null; line2?: string | null; city?: string | null; postal_code?: string | null };
      name?: string | null;
    } | null;
  };

  if (session.payment_status !== "paid") {
    logger.info({ stripeSessionId }, "Session not yet paid — skipping Printify submission");
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.stripeSessionId, stripeSessionId));

  if (!order) {
    logger.warn({ stripeSessionId }, "No order found for session");
    return;
  }

  if (order.printifyOrderId) {
    logger.info({ orderId: order.id, printifyOrderId: order.printifyOrderId }, "Order already submitted to Printify");
    return;
  }

  const shipping = session.shipping_details;
  const customerEmail = session.customer_details?.email ?? "";

  if (!shipping?.address || !shipping?.name) {
    logger.error({ stripeSessionId }, "No shipping address on session — cannot submit to Printify");
    return;
  }

  const nameParts = shipping.name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName;

  const items = order.items as Array<{ product_id: string; variant_id: number; quantity: number }>;

  logger.info({ orderId: order.id, items }, "Submitting order to Printify");

  const printifyOrder = await printify.createOrder({
    external_id: order.id,
    label: `WW-${order.id.slice(0, 8).toUpperCase()}`,
    line_items: items.map((item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
    })),
    shipping_method: 1,
    send_shipping_notification: true,
    address_to: {
      first_name: firstName,
      last_name: lastName,
      email: customerEmail,
      country: shipping.address.country ?? "US",
      region: shipping.address.state ?? "",
      address1: shipping.address.line1 ?? "",
      address2: shipping.address.line2 ?? undefined,
      city: shipping.address.city ?? "",
      zip: shipping.address.postal_code ?? "",
    },
  });

  await db
    .update(ordersTable)
    .set({
      status: "submitted",
      printifyOrderId: printifyOrder.id,
      customerEmail,
      shippingAddress: shipping.address,
      updatedAt: new Date(),
    })
    .where(eq(ordersTable.id, order.id));

  logger.info({ orderId: order.id, printifyOrderId: printifyOrder.id }, "Order successfully submitted to Printify");
}

router.get("/checkout/config", async (req, res): Promise<void> => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch (err: any) {
    req.log.error({ err }, "Failed to get Stripe config");
    res.status(500).json({ error: err.message ?? "Config unavailable" });
  }
});

const ZINGO_CODE = "ZINGO";

router.get("/checkout/validate-coupon", async (req, res): Promise<void> => {
  const { code } = req.query;
  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Missing code" });
    return;
  }
  if (code.trim().toUpperCase() === ZINGO_CODE) {
    res.json({
      valid: true,
      id: "ZINGO_AT_COST",
      code: ZINGO_CODE,
      type: "at_cost",
      percentOff: null,
      amountOff: null,
      label: "At-cost pricing — you pay what we pay",
    });
    return;
  }
  try {
    const stripe = await getUncachableStripeClient();
    const promoCodes = await stripe.promotionCodes.list({ code, active: true, limit: 1 });
    if (promoCodes.data.length === 0) {
      res.json({ valid: false, error: "Invalid or expired code" });
      return;
    }
    const promo = promoCodes.data[0];
    const coupon = promo.coupon;
    res.json({
      valid: true,
      id: promo.id,
      code: promo.code,
      type: "standard",
      percentOff: coupon.percent_off ?? null,
      amountOff: coupon.amount_off ?? null,
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to validate coupon");
    res.status(500).json({ error: "Could not validate code" });
  }
});

const PRINTIFY_SHIPPING: Record<number, { first: number; additional: number }> = {
  77: { first: 769, additional: 209 },
  706: { first: 399, additional: 209 },
};

const DEFAULT_SHIPPING = { first: 699, additional: 209 };

async function computeAtCostDiscount(
  items: Array<{ product_id: string; variant_id: number; quantity: number }>
): Promise<number> {
  const products = await Promise.all(
    items.map(async (item) => {
      const product = await printify.getProduct(item.product_id);
      const variant = product.variants.find((v) => v.id === item.variant_id);
      if (!variant) throw new Error(`Variant ${item.variant_id} not found`);
      return { product, variant, quantity: item.quantity };
    })
  );

  let totalDiscount = 0;

  for (const { product, variant, quantity } of products) {
    const markup = variant.price - variant.cost;
    totalDiscount += markup * quantity;
  }

  let firstItemDone = false;
  for (const { product, quantity } of products) {
    const shipping = PRINTIFY_SHIPPING[(product as any).blueprint_id] ?? DEFAULT_SHIPPING;
    if (!firstItemDone) {
      totalDiscount += shipping.first;
      totalDiscount += shipping.additional * (quantity - 1);
      firstItemDone = true;
    } else {
      totalDiscount += shipping.additional * quantity;
    }
  }

  return totalDiscount;
}

router.post("/checkout/embedded-session", async (req, res): Promise<void> => {
  try {
    const { items, promoCodeId } = req.body as {
      items: Array<{ product_id: string; variant_id: number; quantity: number }>;
      promoCodeId?: string;
    };

    if (!items || items.length === 0) {
      res.status(400).json({ error: "No items provided" });
      return;
    }

    const stripe = await getUncachableStripeClient();

    const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
    const baseUrl = domain ? `https://${domain}` : "http://localhost";

    const lineItems = await Promise.all(
      items.map(async (item) => {
        const product = await printify.getProduct(item.product_id);
        const variant = product.variants.find((v) => v.id === item.variant_id);
        if (!variant) throw new Error(`Variant ${item.variant_id} not found`);

        const image = product.images.find(
          (img) => img.variant_ids.includes(item.variant_id) || img.is_default
        );

        return {
          price_data: {
            currency: "usd",
            unit_amount: variant.price,
            product_data: {
              name: `${product.title} — ${variant.title}`,
              description: product.description?.replace(/<[^>]+>/g, "").slice(0, 500) || undefined,
              images: image ? [`${baseUrl}${image.src}`] : [],
            },
          },
          quantity: item.quantity,
        };
      })
    );

    const orderId = randomUUID();

    // No promo field inside Stripe's form — codes (incl. ZINGO) are applied via the cart
    let discountConfig: Record<string, unknown> = {};

    if (promoCodeId === "ZINGO_AT_COST") {
      const discountAmount = await computeAtCostDiscount(items);
      req.log.info({ discountAmount }, "ZINGO at-cost discount computed");

      const tempCoupon = await stripe.coupons.create({
        amount_off: discountAmount,
        currency: "usd",
        duration: "once",
        name: "ZINGO — At-Cost Pricing",
        max_redemptions: 1,
      });

      discountConfig = { discounts: [{ coupon: tempCoupon.id }] };
    } else if (promoCodeId) {
      discountConfig = { discounts: [{ promotion_code: promoCodeId }] };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ui_mode: "embedded_page" as any,
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR", "ES", "IT", "NL", "SE", "NO", "DK", "FI"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 699, currency: "usd" },
            display_name: "Standard Shipping (5–10 business days)",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 5 },
              maximum: { unit: "business_day", value: 10 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 1299, currency: "usd" },
            display_name: "Express Shipping (2–4 business days)",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 4 },
            },
          },
        },
      ],
      return_url: `${baseUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      metadata: { order_id: orderId },
      ...discountConfig,
    } as Parameters<typeof stripe.checkout.sessions.create>[0]);

    await db.insert(ordersTable).values({
      id: orderId,
      stripeSessionId: session.id,
      status: "pending",
      items,
      totalAmount: "0",
    });

    res.json({ clientSecret: session.client_secret });
  } catch (err: any) {
    req.log.error({ err }, "Failed to create embedded checkout session");
    res.status(500).json({ error: err.message ?? "Checkout failed" });
  }
});

router.post("/checkout/session", async (req, res): Promise<void> => {
  try {
    const { items } = req.body as {
      items: Array<{ product_id: string; variant_id: number; quantity: number }>;
    };

    if (!items || items.length === 0) {
      res.status(400).json({ error: "No items provided" });
      return;
    }

    const stripe = await getUncachableStripeClient();

    const lineItems = await Promise.all(
      items.map(async (item) => {
        const product = await printify.getProduct(item.product_id);
        const variant = product.variants.find((v) => v.id === item.variant_id);
        if (!variant) throw new Error(`Variant ${item.variant_id} not found`);

        const image = product.images.find(
          (img) => img.variant_ids.includes(item.variant_id) || img.is_default
        );

        return {
          price_data: {
            currency: "usd",
            unit_amount: variant.price,
            product_data: {
              name: `${product.title} — ${variant.title}`,
              description: product.description?.slice(0, 500) || undefined,
              images: image ? [image.src] : [],
            },
          },
          quantity: item.quantity,
        };
      })
    );

    const orderId = randomUUID();
    const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
    const baseUrl = domain ? `https://${domain}` : "http://localhost";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR", "ES", "IT", "NL", "SE", "NO", "DK", "FI"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 699, currency: "usd" },
            display_name: "Standard Shipping (5–10 business days)",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 5 },
              maximum: { unit: "business_day", value: 10 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 1299, currency: "usd" },
            display_name: "Express Shipping (2–4 business days)",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 4 },
            },
          },
        },
      ],
      success_url: `${baseUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/shop`,
      metadata: { order_id: orderId },
    });

    await db.insert(ordersTable).values({
      id: orderId,
      stripeSessionId: session.id,
      status: "pending",
      items,
      totalAmount: String(session.amount_total ?? 0),
    });

    res.json({ url: session.url });
  } catch (err: any) {
    req.log.error({ err }, "Failed to create checkout session");
    res.status(500).json({ error: err.message ?? "Checkout failed" });
  }
});

router.get("/checkout/session/:sessionId", async (req, res): Promise<void> => {
  try {
    const { sessionId } = req.params;

    await submitOrderToPrintify(sessionId).catch((err) => {
      req.log.error({ err }, "Printify order submission failed");
    });

    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.stripeSessionId, sessionId));

    res.json({
      data: {
        session: {
          id: session.id,
          status: session.payment_status,
          customer_email: session.customer_details?.email,
          amount_total: session.amount_total,
          currency: session.currency,
        },
        order: order ?? null,
      },
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to get session");
    res.status(500).json({ error: err.message ?? "Failed to fetch session" });
  }
});

export { submitOrderToPrintify };
export default router;
