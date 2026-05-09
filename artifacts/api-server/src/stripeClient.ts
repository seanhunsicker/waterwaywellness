import Stripe from 'stripe';
import { StripeSync } from 'stripe-replit-sync';

let stripeSync: StripeSync | null = null;

async function getCredentials(): Promise<{ publishableKey: string; secretKey: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error(
      'Missing Replit environment variables. ' +
      'Ensure the Stripe integration is connected via the Integrations tab.'
    );
  }

  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const targetEnvironment = isProduction ? 'production' : 'development';

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', 'stripe');
  url.searchParams.set('environment', targetEnvironment);

  const resp = await fetch(url.toString(), {
    headers: { Accept: 'application/json', 'X-Replit-Token': xReplitToken },
    signal: AbortSignal.timeout(10_000),
  });

  if (!resp.ok) {
    throw new Error(`Failed to fetch Stripe credentials: ${resp.status} ${resp.statusText}`);
  }

  const data = await resp.json() as { items?: Array<{ settings?: { publishable?: string; secret?: string } }> };
  const settings = data.items?.[0]?.settings;

  if (!settings?.publishable || !settings?.secret) {
    throw new Error(
      'Stripe integration not connected or missing keys. ' +
      'Connect Stripe via the Integrations tab first.'
    );
  }

  return { publishableKey: settings.publishable, secretKey: settings.secret };
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getCredentials();
  return new Stripe(secretKey, { apiVersion: '2025-03-31.basil' });
}

export async function getStripePublishableKey(): Promise<string> {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

export async function getStripeSync(): Promise<StripeSync> {
  if (!stripeSync) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL required');
    const { secretKey } = await getCredentials();
    stripeSync = new StripeSync({
      poolConfig: { connectionString: databaseUrl, max: 2 },
      stripeSecretKey: secretKey,
      stripeWebhookSecret: '',
    });
  }
  return stripeSync;
}
