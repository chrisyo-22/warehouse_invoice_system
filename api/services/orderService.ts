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
      SELECT id, date, recipient, owner, invoice_number, status, created_at, updated_at
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
      "SELECT id, date, recipient, owner, invoice_number, original_message, status, created_at, updated_at FROM orders WHERE id = ? AND owner = ?",
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
        let productNameForDb = item.product_name;
        let descriptionForDb = item.description ?? null;
        let unitPriceForDb = item.unit_price ?? null;
        let unitForDb = item.unit ?? null;
        let productIdForDb: number | null = null;

        if (item.product_id && typeof item.product_id === 'number' && item.product_id > 0) {
          const productResult = await db.execute(
            "SELECT name, description, price, unit FROM products WHERE id = ?",
            [item.product_id]
          );
          if (!productResult.rows || productResult.rows.length === 0) {
            throw new Error(`Product with ID ${item.product_id} not found.`);
          }
          const productDetails = productResult.rows[0];
          productNameForDb = productDetails.name;
          descriptionForDb = productDetails.description ?? descriptionForDb; // Use product's desc if available, else item's
          unitPriceForDb = productDetails.price ?? unitPriceForDb; // Use product's price if available
          unitForDb = productDetails.unit ?? unitForDb; // Use product's unit if available
          productIdForDb = item.product_id;
        }

        await db.execute(
          `INSERT INTO order_items (
            order_id, 
            product_id,
            product_name, 
            quantity, 
            description, 
            unit_price, 
            unit
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            productIdForDb,
            productNameForDb,
            item.quantity,
            descriptionForDb,
            unitPriceForDb,
            unitForDb
          ]
        );
      }
      await db.execute("COMMIT");
      const itemsResult = await db.execute(`
        SELECT 
          oi.id as item_id,
          oi.product_id, 
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
        status: orderDetails.status, // Added status field
        original_message: orderDetails.original_message,
        items: Array.isArray(itemsResult.rows) ? itemsResult.rows.map((item: any) => ({
          id: item.item_id,
          product_id: item.product_id, // Added product_id
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

    if (!context.request.hasBody) {
        setErrorResponse(context, 400, "No request body", "INVALID_REQUEST");
        return;
    }
    const orderData = await context.request.body.json();

    if (Object.keys(orderData).length === 0) { 
      context.response.status = 400;
      context.response.body = { status: "error", message: "No data provided for update", code: "INVALID_REQUEST" };
      return;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (orderData.date !== undefined) {
      updates.push("date = ?");
      params.push(orderData.date);
    }
    if (orderData.recipient !== undefined) {
      updates.push("recipient = ?");
      params.push(orderData.recipient);
    }
    if (orderData.status !== undefined) {
      updates.push("status = ?");
      params.push(orderData.status);
    }
    // Add other fields from orderData as needed, e.g. original_message

    if (updates.length === 0) {
      context.response.status = 400;
      context.response.body = { status: "error", message: "No updatable fields provided", code: "NO_FIELDS_TO_UPDATE" };
      return;
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");

    const query = `UPDATE orders SET ${updates.join(", ")} WHERE id = ? AND owner = ?`;
    params.push(id);
    params.push(userId);

    const updateResult = await db.execute(query, params);
    
    if (updateResult.affectedRows === 0) { // Check if any row was actually updated
        context.response.status = 404; 
        context.response.body = { status: "error", message: "Order not found, not authorized to update, or no data changed", code: "NOT_FOUND_OR_UNAUTHORIZED_OR_NO_CHANGE" };
        return;
    }

    const updatedOrderResult = await db.execute("SELECT * FROM orders WHERE id = ? AND owner = ?", [id, userId]);
    // Ensure an order was actually found after update attempt (should be redundant if affectedRows > 0 but good practice)
    if (!updatedOrderResult.rows || updatedOrderResult.rows.length === 0) {
        context.response.status = 404;
        context.response.body = { status: "error", message: "Order not found after update", code: "NOT_FOUND" };
        return;
    }
    context.response.body = { status: "success", data: updatedOrderResult.rows[0] };

  } catch (error) {
    console.error("Error in updateOrder:", error); 
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