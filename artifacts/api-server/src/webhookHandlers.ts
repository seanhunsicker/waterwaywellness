import { logger } from './lib/logger';
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

    try {
      const body = JSON.parse(payload.toString()) as { type?: string; data?: { object?: { id?: string } } };
      const eventType = body.type;
      const sessionId = body.data?.object?.id;

      if (eventType === 'checkout.session.completed' && sessionId) {
        logger.info({ sessionId }, 'Webhook: checkout.session.completed — submitting to Printify');
        await submitOrderToPrintify(sessionId).catch((err) => {
          logger.error({ err }, 'Webhook: Printify order submission failed');
        });
      }
    } catch (err) {
      logger.warn({ err }, 'Webhook: failed to parse or handle event');
    }
  }
}
