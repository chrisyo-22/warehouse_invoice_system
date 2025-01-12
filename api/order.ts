import { Router } from "https://deno.land/x/oak/mod.ts";
import { Order, OrderItem } from "./types.ts";
import db from "./db.ts";
import { authMiddleware } from "./middleware/auth.ts";
import {
  validateOrderId,
  validateOrderFields,
  validateOrderItems,
  validateItemIds,
  setErrorResponse
} from "./utils/validations.ts";

// Create router with /api prefix
const orderRouter = new Router({ prefix: "/api" });

// Apply auth middleware to all order routes
orderRouter.use(authMiddleware);

// GET /orders - List all orders (without items)
orderRouter.get("/orders", async (context) => {
  try {
    const { date, recipient } = context.request.url.searchParams;
    const userId = context.state.user.id; // Get authenticated user's ID
    
    // Query for orders only (no items)
    let orderQuery = `
      SELECT id, date, recipient, owner, invoice_number, created_at, updated_at
      FROM orders 
      WHERE owner = ?
    `;
    const params: any[] = [userId];

    if (date) {
      orderQuery += " AND date = ?";
      params.push(date);
    }
    if (recipient) {
      orderQuery += " AND recipient LIKE ?";
      params.push(`%${recipient}%`);
    }

    orderQuery += " ORDER BY created_at DESC";

    const orderResults = await db.execute(orderQuery, params);

    context.response.body = {
      status: "success",
      data: {
        orders: orderResults.rows
      }
    };
  } catch (error) {
    console.error(error);
    context.response.status = 500;
    context.response.body = {
      status: "error",
      message: "Database error",
      code: "DB_ERROR"
    };
  }
});

// GET /order/:id - Get single order with items
orderRouter.get("/order/:id", async (context) => {
  try {
    const orderId = context.params.id;
    const userId = context.state.user.id; // Get authenticated user's ID
    
    // Validate orderId is a valid number
    if (!orderId || isNaN(Number(orderId))) {
      context.response.status = 400;
      context.response.body = {
        status: "error",
        message: "Invalid order ID. Must be a number.",
        code: "INVALID_ID"
      };
      return;
    }

    const id = parseInt(orderId);
    
    // Additional validation for positive integers
    if (id <= 0) {
      context.response.status = 400;
      context.response.body = {
        status: "error",
        message: "Order ID must be a positive number.",
        code: "INVALID_ID"
      };
      return;
    }
    
    // Get order details with user check
    const orderResult = await db.execute(
      "SELECT id, date, recipient, owner, invoice_number, original_message, created_at, updated_at FROM orders WHERE id = ? AND owner = ?",
      [id, userId]
    );

    if (!orderResult.rows.length) {
      context.response.status = 404;
      context.response.body = {
        status: "error",
        message: "Order not found or access denied",
        code: "NOT_FOUND"
      };
      return;
    }

    const orderDetails = orderResult.rows[0];

    // Get items for this order
    const itemsResult = await db.execute(`
      SELECT 
        id as item_id,
        product_name,
        quantity,
        description,
        unit_price,
        unit
      FROM order_items
      WHERE order_id = ?
    `, [id]);

    // Combine order with its items
    const order = {
      ...orderDetails,
      items: itemsResult.rows.map((item: any) => ({
        product_name: item.product_name,
        quantity: item.quantity,
        description: item.description,
        unit_price: item.unit_price,
        unit: item.unit
      }))
    };

    context.response.body = {
      status: "success",
      data: order
    };
  } catch (error) {
    console.error("Error fetching order:", error);
    context.response.status = 500;
    context.response.body = {
      status: "error",
      message: "Database error",
      code: "DB_ERROR"
    };
  }
});

// Function to generate invoice number
async function generateInvoiceNumber(date: string): Promise<string> {
  const result = await db.execute(
    `SELECT COUNT(*) as count 
     FROM orders 
     WHERE DATE(created_at) = DATE(?)`,
    [date]
  );
  
  const count = result.rows[0].count + 1;
  const dateStr = date.replace(/-/g, '');
  return `INV${dateStr}-${count.toString().padStart(3, '0')}`;
}

// POST /order - Create new order
orderRouter.post("/order", async (context) => {
  try {
    if (!context.request.hasBody) {
      setErrorResponse(context, 400, "No request body", "INVALID_REQUEST");
      return;
    }

    const orderData = await context.request.body.json();
    const userId = context.state.user.id; // Get authenticated user's ID

    if (!validateOrderFields(context, orderData)) {
      return;
    }

    if (!validateOrderItems(context, orderData.items)) {
      return;
    }

    await db.execute("START TRANSACTION");

    try {
      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber(orderData.date);
      
      // Log for debugging
      console.log('Creating order with user ID:', userId);
      
      const orderResult = await db.execute(
        "INSERT INTO orders (date, recipient, owner, original_message, invoice_number) VALUES (?, ?, ?, ?, ?)",
        [orderData.date, orderData.recipient, userId, orderData.original_message || null, invoiceNumber]
      );
      
      const orderId = orderResult.lastInsertId!;

      for (const item of orderData.items) {
        await db.execute(
          `INSERT INTO order_items (
            order_id, 
            product_name, 
            quantity, 
            description, 
            unit_price, 
            unit
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.product_name,
            item.quantity,
            item.description ?? null,
            item.unit_price ?? null,
            item.unit ?? null
          ]
        );
      }

      await db.execute("COMMIT");

      // Fetch the created order with its items
      const itemsResult = await db.execute(`
        SELECT 
          oi.id as item_id, 
          oi.product_name, 
          oi.quantity, 
          oi.description, 
          oi.unit_price,
          oi.unit
        FROM order_items oi
        WHERE oi.order_id = ?
      `, [orderId]);

      const orderDetailsResult = await db.execute(
        "SELECT * FROM orders WHERE id = ?",
        [orderId]
      );

      const orderDetails = orderDetailsResult.rows[0];

      // Transform the result to match our API format
      const newOrder = {
        id: orderId,
        date: orderDetails.date,
        recipient: orderDetails.recipient,
        owner: orderDetails.owner,
        invoice_number: orderDetails.invoice_number,
        original_message: orderDetails.original_message,
        items: Array.isArray(itemsResult.rows) ? itemsResult.rows.map((item: any) => ({
          id: item.item_id,
          product_name: item.product_name,
          quantity: Number(item.quantity),
          description: item.description,
          unit_price: item.unit_price !== null ? Number(item.unit_price) : null,
          unit: item.unit
        })) : [],
        created_at: orderDetails.created_at,
        updated_at: orderDetails.updated_at
      };

      context.response.status = 201;
      context.response.body = {
        status: "success",
        data: newOrder
      };
    } catch (error) {
      await db.execute("ROLLBACK");
      console.error("Database error:", error);
      throw error;
    }
  } catch (error) {
    console.error("Request error:", error);
    context.response.status = 500;
    context.response.body = {
      status: "error",
      message: "Internal server error",
      code: "SERVER_ERROR"
    };
  }
});

// PUT /order/{id} - Update existing order
orderRouter.put("/order/:id", async (context) => {
  try {
    const orderId = parseInt(context.params.id!);
    const userId = context.state.user.id;

    if (isNaN(orderId) || orderId <= 0) {
      context.response.status = 400;
      context.response.body = {
        status: "error",
        message: "Invalid order ID. Must be a positive number.",
        code: "INVALID_ID"
      };
      return;
    }

    // First check if order exists and belongs to user
    const orderResult = await db.execute(
      "SELECT * FROM orders WHERE id = ? AND owner = ?",
      [orderId, userId]
    );

    if (!orderResult.rows.length) {
      context.response.status = 404;
      context.response.body = {
        status: "error",
        message: "Order not found",
        code: "NOT_FOUND"
      };
      return;
    }

    // Get update data
    const updateData = await context.request.body.json();

    // Start transaction
    await db.execute("START TRANSACTION");

    try {
      // Update order details if provided, excluding original_message
      if (updateData.date || updateData.recipient) {
        await db.execute(
          "UPDATE orders SET date = COALESCE(?, date), recipient = COALESCE(?, recipient) WHERE id = ? AND owner = ?",
          [updateData.date, updateData.recipient, orderId, userId]
        );
      }

      // Update items if provided
      if (updateData.items) {
        // First delete existing items
        await db.execute(
          "DELETE FROM order_items WHERE order_id = ?",
          [orderId]
        );

        // Insert new items
        for (const item of updateData.items) {
          await db.execute(
            "INSERT INTO order_items (order_id, product_name, quantity, description, unit_price, unit) VALUES (?, ?, ?, ?, ?, ?)",
            [orderId, item.product_name, item.quantity, item.description ?? null, item.unit_price ?? null, item.unit ?? null]
          );
        }
      }

      await db.execute("COMMIT");

      // Fetch updated order
      const items = await db.execute(`
        SELECT 
          oi.id as item_id, 
          oi.product_name, 
          oi.quantity, 
          oi.description, 
          oi.unit_price,
          oi.unit
        FROM order_items oi
        WHERE oi.order_id = ?
      `, [orderId]);

      const orderDetailsResult = await db.execute(
        "SELECT * FROM orders WHERE id = ? AND owner = ?",
        [orderId, userId]
      );

      const orderDetails = orderDetailsResult.rows[0];

      const updatedOrder = {
        id: orderId,
        date: orderDetails.date,
        recipient: orderDetails.recipient,
        owner: orderDetails.owner,
        original_message: orderDetails.original_message,
        items: items.rows.map((item: any) => ({
          product_name: item.product_name,
          quantity: Number(item.quantity),
          description: item.description,
          unit_price: item.unit_price !== null ? Number(item.unit_price) : null,
          unit: item.unit
        })),
        created_at: orderDetails.created_at,
        updated_at: orderDetails.updated_at
      };

      context.response.body = {
        status: "success",
        data: updatedOrder
      };
    } catch (error) {
      await db.execute("ROLLBACK");
      console.error("Update error:", error);
      throw error;
    }
  } catch (error) {
    console.error("Request error:", error);
    context.response.status = 400;
    context.response.body = {
      status: "error",
      message: error instanceof Error ? error.message : "Invalid request body",
      code: "INVALID_REQUEST"
    };
  }
});

// DELETE /order/{id} - Delete order
orderRouter.delete("/order/:id", async (context) => {
  try {
    const orderId = parseInt(context.params.id!);
    const userId = context.state.user.id;

    if (isNaN(orderId) || orderId <= 0) {
      context.response.status = 400;
      context.response.body = {
        status: "error",
        message: "Invalid order ID. Must be a positive number.",
        code: "INVALID_ID"
      };
      return;
    }

    // Check if order exists and belongs to user
    const orderResult = await db.execute(
      "SELECT id FROM orders WHERE id = ? AND owner = ?",
      [orderId, userId]
    );

    if (!orderResult.rows.length) {
      context.response.status = 404;
      context.response.body = {
        status: "error",
        message: "Order not found",
        code: "NOT_FOUND"
      };
      return;
    }

    // Delete order (cascade will handle items)
    await db.execute(
      "DELETE FROM orders WHERE id = ? AND owner = ?",
      [orderId, userId]
    );

    context.response.body = {
      status: "success",
      message: "Order deleted successfully"
    };
  } catch (error) {
    console.error("Delete error:", error);
    context.response.status = 500;
    context.response.body = {
      status: "error",
      message: "Failed to delete order",
      code: "DELETE_ERROR"
    };
  }
});

// DELETE /order/{id}/items - Delete specific items from an order
orderRouter.delete("/order/:id/items", async (context) => {
  try {
    const orderId = parseInt(context.params.id!);

    if (!validateOrderId(context, orderId)) {
      return;
    }

    // Check if order exists
    const orderResult = await db.execute(
      "SELECT id FROM orders WHERE id = ?",
      [orderId]
    );

    if (!orderResult.rows.length) {
      setErrorResponse(context, 404, "Order not found", "NOT_FOUND");
      return;
    }

    const body = await context.request.body.json();
    if (!validateItemIds(context, body.item_ids)) {
      return;
    }

    // Verify all items belong to the order
    const itemsResult = await db.execute(
      "SELECT id FROM order_items WHERE order_id = ? AND id IN (" + 
      Array(body.item_ids.length).fill('?').join(',') + ")",
      [orderId, ...body.item_ids]
    );

    const foundItemIds = itemsResult.rows.map((item: { id: number }) => item.id);
    const invalidItemIds = body.item_ids.filter((id: number) => !foundItemIds.includes(id));

    if (invalidItemIds.length > 0) {
      context.response.status = 400;
      context.response.body = {
        status: "error",
        message: `Items not found or don't belong to this order: ${invalidItemIds.join(", ")}`,
        code: "INVALID_ITEMS"
      };
      return;
    }

    // Delete the items
    await db.execute(
      "DELETE FROM order_items WHERE order_id = ? AND id IN (" + 
      Array(body.item_ids.length).fill('?').join(',') + ")",
      [orderId, ...body.item_ids]
    );

    context.response.body = {
      status: "success",
      message: "Items deleted successfully",
      data: {
        deleted_items: body.item_ids
      }
    };
  } catch (error) {
    console.error("Delete items error:", error);
    setErrorResponse(context, 500, "Failed to delete items", "DELETE_ERROR");
  }
});

// POST /order/parse - Parse text and create order
orderRouter.post("/order/parse", async (context) => {
  try {
    if (!context.request.hasBody) {
      setErrorResponse(context, 400, "No request body", "INVALID_REQUEST");
      return;
    }

    const requestData = await context.request.body.json();
    const { text, recipient: providedRecipient } = requestData;
    const userId = context.state.user.id; // Get authenticated user's ID

    if (!text) {
      setErrorResponse(context, 400, "Text field is required", "INVALID_REQUEST");
      return;
    }

    // Call the AI parser endpoint
    const parserResponse = await fetch("http://localhost:8000/ai/parse", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    if (!parserResponse.ok) {
      const error = await parserResponse.json();
      throw new Error(`AI Parser error: ${JSON.stringify(error)}`);
    }

    const parserResult = await parserResponse.json();
    const parsedData = parserResult.data;

    // Use provided recipient if AI parser returned 'unknown'
    const recipient = parsedData.recipient === "unknown" && providedRecipient 
      ? providedRecipient 
      : parsedData.recipient;

    // Prepare order data
    const orderData = {
      date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
      recipient: recipient,
      owner: userId, // Use authenticated user's ID instead of "system"
      items: parsedData.items,
      original_message: text
    };

    // Create the order using the existing endpoint logic
    await db.execute("START TRANSACTION");

    try {
      const orderResult = await db.execute(
        "INSERT INTO orders (date, recipient, owner, original_message) VALUES (?, ?, ?, ?)",
        [orderData.date, orderData.recipient, orderData.owner, orderData.original_message]
      );
      
      const orderId = orderResult.lastInsertId!;

      for (const item of orderData.items) {
        await db.execute(
          `INSERT INTO order_items (
            order_id, 
            product_name, 
            quantity, 
            unit
          ) VALUES (?, ?, ?, ?)`,
          [
            orderId,
            item.product_name,
            item.quantity,
            item.unit
          ]
        );
      }

      await db.execute("COMMIT");

      // Fetch the created order with its items
      const itemsResult = await db.execute(`
        SELECT 
          oi.id as item_id, 
          oi.product_name, 
          oi.quantity, 
          oi.unit
        FROM order_items oi
        WHERE oi.order_id = ?
      `, [orderId]);

      const orderDetailsResult = await db.execute(
        "SELECT * FROM orders WHERE id = ?",
        [orderId]
      );

      const orderDetails = orderDetailsResult.rows[0];

      // Transform the result to match our API format
      const newOrder = {
        id: orderId,
        date: orderDetails.date,
        recipient: orderDetails.recipient,
        owner: orderDetails.owner,
        original_message: orderDetails.original_message,
        items: Array.isArray(itemsResult.rows) ? itemsResult.rows.map((item: any) => ({
          id: item.item_id,
          product_name: item.product_name,
          quantity: Number(item.quantity),
          unit: item.unit
        })) : [],
        created_at: orderDetails.created_at,
        updated_at: orderDetails.updated_at
      };

      context.response.status = 201;
      context.response.body = {
        status: "success",
        data: newOrder
      };
    } catch (error) {
      await db.execute("ROLLBACK");
      console.error("Database error:", error);
      throw error;
    }

  } catch (error) {
    console.error("Parse and create order error:", error);
    context.response.status = 500;
    context.response.body = {
      status: "error",
      message: error.message || "Internal server error",
      code: "ORDER_CREATION_ERROR"
    };
  }
});

export default orderRouter; 