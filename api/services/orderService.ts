import { Context } from "https://deno.land/x/oak/mod.ts";
import db from "../db/db.ts";
import {
  validateOrderId,
  validateOrderFields,
  validateOrderItems,
  validateItemIds,
  setErrorResponse
} from "../utils/validations.ts";
import { parseTextWithAI } from "./aiParserService.ts";

export async function listOrders(context: Context) {
  try {
    const { date, recipient } = context.request.url.searchParams;
    const userId = context.state.user.id;
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
}

export async function getOrder(context: Context) {
  try {
    const orderId = context.params.id;
    const userId = context.state.user.id;
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
    if (id <= 0) {
      context.response.status = 400;
      context.response.body = {
        status: "error",
        message: "Order ID must be a positive number.",
        code: "INVALID_ID"
      };
      return;
    }
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
}

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

export async function createOrder(context: Context) {
  try {
    if (!context.request.hasBody) {
      setErrorResponse(context, 400, "No request body", "INVALID_REQUEST");
      return;
    }
    const orderData = await context.request.body.json();
    const userId = context.state.user.id;
    if (!validateOrderFields(context, orderData)) {
      return;
    }
    if (!validateOrderItems(context, orderData.items)) {
      return;
    }
    await db.execute("START TRANSACTION");
    try {
      const invoiceNumber = await generateInvoiceNumber(orderData.date);
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
}

export async function updateOrder(context: Context) {
  try {
    const orderId = context.params.id;
    const userId = context.state.user.id;
    if (!orderId || isNaN(Number(orderId))) {
      context.response.status = 400;
      context.response.body = { status: "error", message: "Invalid order ID", code: "INVALID_ID" };
      return;
    }
    const id = parseInt(orderId);
    const orderData = await context.request.body.json();
    // Validate fields (optional: add more validation)
    if (!orderData) {
      context.response.status = 400;
      context.response.body = { status: "error", message: "No data provided", code: "INVALID_REQUEST" };
      return;
    }
    // Update order
    await db.execute(
      "UPDATE orders SET date = ?, recipient = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND owner = ?",
      [orderData.date, orderData.recipient, id, userId]
    );
    // Optionally update items (not implemented here)
    const updatedOrder = await db.execute("SELECT * FROM orders WHERE id = ? AND owner = ?", [id, userId]);
    context.response.body = { status: "success", data: updatedOrder.rows[0] };
  } catch (error) {
    context.response.status = 500;
    context.response.body = { status: "error", message: error.message || "Internal server error", code: "SERVER_ERROR" };
  }
}

export async function deleteOrder(context: Context) {
  try {
    const orderId = context.params.id;
    const userId = context.state.user.id;
    if (!orderId || isNaN(Number(orderId))) {
      context.response.status = 400;
      context.response.body = { status: "error", message: "Invalid order ID", code: "INVALID_ID" };
      return;
    }
    const id = parseInt(orderId);
    await db.execute("DELETE FROM orders WHERE id = ? AND owner = ?", [id, userId]);
    context.response.body = { status: "success", message: "Order deleted" };
  } catch (error) {
    context.response.status = 500;
    context.response.body = { status: "error", message: error.message || "Internal server error", code: "SERVER_ERROR" };
  }
}

export async function deleteOrderItems(context: Context) {
  try {
    const orderId = context.params.id;
    const userId = context.state.user.id;
    const { item_ids } = await context.request.body.json();
    if (!orderId || isNaN(Number(orderId)) || !Array.isArray(item_ids)) {
      context.response.status = 400;
      context.response.body = { status: "error", message: "Invalid request", code: "INVALID_REQUEST" };
      return;
    }
    const id = parseInt(orderId);
    // Ensure order belongs to user
    const orderResult = await db.execute("SELECT id FROM orders WHERE id = ? AND owner = ?", [id, userId]);
    if (!orderResult.rows.length) {
      context.response.status = 404;
      context.response.body = { status: "error", message: "Order not found", code: "NOT_FOUND" };
      return;
    }
    // Delete items
    await db.execute(
      `DELETE FROM order_items WHERE order_id = ? AND id IN (${item_ids.map(() => '?').join(',')})`,
      [id, ...item_ids]
    );
    context.response.body = { status: "success", data: { deleted_items: item_ids } };
  } catch (error) {
    context.response.status = 500;
    context.response.body = { status: "error", message: error.message || "Internal server error", code: "SERVER_ERROR" };
  }
}

export async function parseAndCreateOrder(context: Context) {
  try {
    if (!context.request.hasBody) {
      context.response.status = 400;
      context.response.body = {
        status: "error",
        message: "No request body",
        code: "INVALID_REQUEST"
      };
      return;
    }
    const body = await context.request.body.json();
    const { text } = body;
    if (!text) {
      context.response.status = 400;
      context.response.body = {
        status: "error",
        message: "Text field is required",
        code: "INVALID_REQUEST"
      };
      return;
    }
    const parsedData = await parseTextWithAI(text);
    context.response.status = 200;
    context.response.body = {
      status: "success",
      data: parsedData
    };
  } catch (error) {
    context.response.status = 500;
    context.response.body = {
      status: "error",
      message: error.message || "Internal server error",
      code: "AI_PARSER_ERROR"
    };
  }
} 