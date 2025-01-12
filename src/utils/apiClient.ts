// src/utils/apiClient.ts

import store from '../store';

// Helper function to get headers with auth token
function getHeaders() {
  const token = store.getters['auth/token'];
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

// Function to fetch all orders
export async function fetchOrders() {
  const response = await fetch(`/api/orders`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error(`Error fetching orders: ${response.statusText}`);
  }
  return response.json();
}

// Function to fetch a single order by ID
export async function fetchOrderById(orderId: number) {
  const response = await fetch(`/api/order/${orderId}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error(`Error fetching order: ${response.statusText}`);
  }
  return response.json();
}

// Function to create a new order
export async function createOrder(orderData: any) {
  const response = await fetch(`/api/order`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(orderData),
  });
  if (!response.ok) {
    throw new Error(`Error creating order: ${response.statusText}`);
  }
  return response.json();
}

// Function to update an existing order
export async function updateOrder(orderId: number, updateData: any) {
  const response = await fetch(`/api/order/${orderId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(updateData),
  });
  if (!response.ok) {
    throw new Error(`Error updating order: ${response.statusText}`);
  }
  return response.json();
}

// Function to delete an order
export async function deleteOrder(orderId: number) {
  const response = await fetch(`/api/order/${orderId}`, {
    method: "DELETE",
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error(`Error deleting order: ${response.statusText}`);
  }
  return response.json();
}

export async function createOrderFromMessage(text: string, recipient?: string) {
  try {
    const response = await fetch(`/api/order/parse`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        text,
        recipient
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create order from message');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating order from message:', error);
    throw error;
  }
}