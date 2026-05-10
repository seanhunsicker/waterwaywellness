import app from "./app";
import { logger } from "./lib/logger";
import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./stripeClient";

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required.");
  }

  try {
    logger.info("Initializing Stripe schema...");
    await runMigrations({ databaseUrl });
    logger.info("Stripe schema ready");

    const stripeSync = await getStripeSync();
    logger.info("Stripe sync initialized");

    stripeSync.syncBackfill()
      .then(() => logger.info("Stripe backfill complete"))
      .catch((err: unknown) => logger.warn({ err }, "Stripe backfill skipped"));
  } catch (err) {
    logger.warn({ err }, "Stripe init failed — continuing without Stripe");
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

await initStripe();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");

  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  const baseUrl = domain ? `https://${domain}` : `http://localhost:${port}`;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  logger.info(
    {
      webhookUrl: `${baseUrl}/api/stripe/webhook`,
      signatureVerification: webhookSecret ? "enabled" : "disabled — set STRIPE_WEBHOOK_SECRET env var to enable",
      event: "checkout.session.completed",
    },
    "Stripe webhook endpoint ready"
  );
});
