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

router.post("/checkout/embedded-session", async (req, res): Promise<void> => {
  try {
    const { items } = req.body as {
      items: Array<{ product_id: string; variant_id: number; quantity: number }>;
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
    });

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
