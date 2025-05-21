import { Router } from "https://deno.land/x/oak/mod.ts";
import { authMiddleware } from "./middleware/auth.ts";
import * as OrderService from "./services/orderService.ts";

// Create router with /api prefix
const orderRouter = new Router({ prefix: "/api" });

// Apply auth middleware to all order routes
orderRouter.use(authMiddleware);

// GET /orders - List all orders (without items)
orderRouter.get("/orders", OrderService.listOrders);

// GET /order/:id - Get single order with items
orderRouter.get("/order/:id", OrderService.getOrder);

// POST /order - Create new order
orderRouter.post("/order", OrderService.createOrder);

// PUT /order/{id} - Update existing order
orderRouter.put("/order/:id", OrderService.updateOrder);

// DELETE /order/{id} - Delete order
orderRouter.delete("/order/:id", OrderService.deleteOrder);

// DELETE /order/{id}/items - Delete specific items from an order
orderRouter.delete("/order/:id/items", OrderService.deleteOrderItems);

// POST /order/parse - Parse text and create order
orderRouter.post("/order/parse", OrderService.parseAndCreateOrder);

export default orderRouter; 