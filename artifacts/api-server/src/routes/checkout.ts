import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { printify } from "../lib/printify";
import { getUncachableStripeClient } from "../stripeClient";
import { db } from "@workspace/db";
import { ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

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
            display_name: "Standard Shipping",
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
            display_name: "Express Shipping",
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
      items: items,
      totalAmount: String(session.amount_total ?? 0),
    });

    res.json({ url: session.url });
  } catch (err: any) {
    req.log.error({ err }, "Failed to create checkout session");
    res.status(500).json({ error: err.message ?? "Checkout failed" });
  }
});

router.get("/checkout/session/:sessionId", async (req, res) => {
  try {
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(
      req.params.sessionId,
      { expand: ["line_items", "shipping_details"] }
    );

    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.stripeSessionId, req.params.sessionId));

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

export default router;
