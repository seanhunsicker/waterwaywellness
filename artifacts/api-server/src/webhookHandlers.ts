import { logger } from './lib/logger';
import { getUncachableStripeClient } from './stripeClient';
import { submitOrderToPrintify } from './routes/checkout';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let eventType: string | undefined;
    let sessionId: string | undefined;

    if (webhookSecret) {
      try {
        const stripe = await getUncachableStripeClient();
        const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        eventType = event.type;
        const obj = event.data.object as { id?: string };
        sessionId = obj.id;
        logger.info({ eventType, sessionId }, 'Webhook: verified and received');
      } catch (err: any) {
        logger.error({ err }, 'Webhook: signature verification failed — rejecting');
        throw new Error(`Webhook signature verification failed: ${err.message}`);
      }
    } else {
      logger.warn('Webhook: STRIPE_WEBHOOK_SECRET not set — skipping signature verification (insecure)');
      try {
        const body = JSON.parse(payload.toString()) as { type?: string; data?: { object?: { id?: string } } };
        eventType = body.type;
        sessionId = body.data?.object?.id;
      } catch (err) {
        logger.warn({ err }, 'Webhook: failed to parse body');
        return;
      }
    }

    if (eventType === 'checkout.session.completed' && sessionId) {
      logger.info({ sessionId }, 'Webhook: checkout.session.completed — submitting to Printify');
      await submitOrderToPrintify(sessionId).catch((err) => {
        logger.error({ err }, 'Webhook: Printify order submission failed');
      });
    } else {
      logger.info({ eventType }, 'Webhook: ignoring event type');
    }
  }
}
