import { Router, type IRouter } from "express";
import { printify } from "../lib/printify";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/printify/products", async (req, res) => {
  try {
    const products = await printify.listProducts();
    res.json({ data: products });
  } catch (err: any) {
    req.log.error({ err }, "Failed to list Printify products");
    res.status(500).json({ error: err.message ?? "Failed to fetch products" });
  }
});

router.get("/printify/products/:productId", async (req, res): Promise<void> => {
  try {
    const product = await printify.getProduct(req.params.productId);
    res.json({ data: product });
  } catch (err: any) {
    req.log.error({ err }, "Failed to get Printify product");
    if (err.message?.includes("404")) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.status(500).json({ error: err.message ?? "Failed to fetch product" });
  }
});

export default router;
