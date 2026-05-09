import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  stripeSessionId: text("stripe_session_id").unique(),
  printifyOrderId: text("printify_order_id"),
  status: text("status").notNull().default("pending"),
  items: jsonb("items").notNull(),
  customerEmail: text("customer_email"),
  shippingAddress: jsonb("shipping_address"),
  totalAmount: text("total_amount"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
