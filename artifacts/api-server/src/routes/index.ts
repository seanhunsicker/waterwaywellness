import { Router, type IRouter } from "express";
import healthRouter from "./health";
import printifyRouter from "./printify";
import checkoutRouter from "./checkout";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(printifyRouter);
router.use(checkoutRouter);
router.use(stripeRouter);

export default router;
