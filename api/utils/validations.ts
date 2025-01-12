import { Context } from "https://deno.land/x/oak/mod.ts";
import { Order, OrderItem } from "../types.ts";

export interface ErrorResponse {
  status: "error";
  message: string;
  code: string;
}

// Validate order ID
export function validateOrderId(context: Context, orderId: number): boolean {
  if (isNaN(orderId) || orderId <= 0) {
    context.response.status = 400;
    context.response.body = {
      status: "error",
      message: "Invalid order ID. Must be a positive number.",
      code: "INVALID_ID"
    };
    return false;
  }
  return true;
}

// Validate required order fields
export function validateOrderFields(context: Context, orderData: Partial<Order>): boolean {
  if (!orderData.date || !orderData.recipient || !orderData.owner || !orderData.items) {
    context.response.status = 400;
    context.response.body = {
      status: "error",
      message: `Missing required fields: ${[
        !orderData.date && "date",
        !orderData.recipient && "recipient",
        !orderData.owner && "owner",
        !orderData.items && "items"
      ].filter(Boolean).join(", ")}`,
      code: "INVALID_REQUEST"
    };
    return false;
  }
  return true;
}

// Validate order items
export function validateOrderItems(context: Context, items: Partial<OrderItem>[]): boolean {
  for (const item of items) {
    if (!item.product_name || !item.quantity) {
      context.response.status = 400;
      context.response.body = {
        status: "error",
        message: `Missing required item fields: ${[
          !item.product_name && "product_name",
          !item.quantity && "quantity"
        ].filter(Boolean).join(", ")}`,
        code: "INVALID_REQUEST"
      };
      return false;
    }

    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      context.response.status = 400;
      context.response.body = {
        status: "error",
        message: "Item quantity must be a positive number",
        code: "INVALID_REQUEST"
      };
      return false;
    }
  }
  return true;
}

// Validate item IDs array
export function validateItemIds(context: Context, itemIds: any): boolean {
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    context.response.status = 400;
    context.response.body = {
      status: "error",
      message: "Invalid item_ids. Must be a non-empty array of numbers.",
      code: "INVALID_REQUEST"
    };
    return false;
  }
  return true;
}

// Set error response
export function setErrorResponse(
  context: Context, 
  status: number, 
  message: string, 
  code: string
): void {
  context.response.status = status;
  context.response.body = {
    status: "error",
    message,
    code
  };
} 