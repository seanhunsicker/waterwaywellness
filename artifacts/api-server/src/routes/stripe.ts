import { Router, type IRouter } from "express";
import { getStripePublishableKey } from "../stripeClient";

const router: IRouter = Router();

router.get("/stripe/config", async (req, res): Promise<void> => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch (err: any) {
    req.log.error({ err }, "Failed to get Stripe config");
    res.status(500).json({ error: "Stripe not configured" });
  }
});

export default router;
