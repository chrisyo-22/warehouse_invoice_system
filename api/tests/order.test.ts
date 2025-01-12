import { assertEquals, assertNotEquals } from "https://deno.land/std/testing/asserts.ts";
import db from "../db.ts";

const BASE_URL = "http://localhost:8000";

// Setup function to reset database before tests
async function setupDatabase() {
  try {
    // Drop tables if they exist
    await db.execute("DROP TABLE IF EXISTS order_items");
    await db.execute("DROP TABLE IF EXISTS orders");
    
    // Create tables
    await db.execute(`
      CREATE TABLE orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        date DATE NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        owner VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE order_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        description TEXT,
        unit_price DECIMAL(10,2),
        unit VARCHAR(50),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    // Create a test order for GET tests
    const testOrder = {
      date: "2024-03-21",
      recipient: "Test User",
      owner: "Test Owner",
      items: [
        {
          product_name: "Initial Test Product",
          quantity: 1,
          description: "Test Description",
          unit_price: 9.99,
          unit: "boxes"
        }
      ]
    };

    // Insert test order
    const response = await fetch(`${BASE_URL}/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testOrder)
    });

    const data = await response.json();
    if (response.status !== 201) {
      console.error('Failed to create initial test order:', data);
      throw new Error('Failed to create initial test order');
    }

    console.log("Database reset and initialized with test data");
  } catch (error) {
    console.error("Setup failed:", error);
    throw error;
  }
}

// Helper function to create a test order
async function createTestOrder() {
  const response = await fetch(`${BASE_URL}/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: "2024-03-21",
      recipient: "Test User",
      owner: "Test Owner",
      items: [{ product_name: "Test Product", quantity: 1 }]
    })
  });
  const data = await response.json();
  return data.data.id;
}

// Run setup before all tests
Deno.test({
  name: "Setup database",
  fn: async () => {
    await setupDatabase();
  },
  sanitizeResources: false,
  sanitizeOps: false
});

// POST /order Tests (run these first to ensure we have data)
Deno.test("POST /order - Success: Create order with minimal fields", async () => {
  const response = await fetch(`${BASE_URL}/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: "2024-03-21",
      recipient: "Test User",
      owner: "Test Owner",
      items: [
        { product_name: "Test Product", quantity: 1 }
      ]
    })
  });
  const data = await response.json();
  
  assertEquals(response.status, 201);
  assertEquals(data.status, "success");
  assertNotEquals(data.data.id, undefined);
});

Deno.test("POST /order - Success: Create order with all fields", async () => {
  const response = await fetch(`${BASE_URL}/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: "2024-03-21",
      recipient: "Test User",
      owner: "Test Owner",
      items: [
        {
          product_name: "Test Product",
          quantity: 1,
          description: "Test Description",
          unit_price: 9.99,
          unit: "boxes"
        }
      ]
    })
  });
  const data = await response.json();
  
  assertEquals(response.status, 201);
  assertEquals(data.status, "success");
  assertEquals(data.data.items[0].unit_price, 9.99);
});

Deno.test("POST /order - Fail: Missing required fields", async () => {
  const response = await fetch(`${BASE_URL}/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: "2024-03-21"
      // missing recipient and items
    })
  });
  const data = await response.json();
  
  assertEquals(response.status, 400);
  assertEquals(data.status, "error");
});

Deno.test("POST /order - Fail: Invalid item data", async () => {
  const response = await fetch(`${BASE_URL}/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: "2024-03-21",
      recipient: "Test User",
      items: [
        { product_name: "Test Product" } // missing quantity
      ]
    })
  });
  const data = await response.json();
  
  assertEquals(response.status, 400);
  assertEquals(data.status, "error");
});

// GET /orders Tests
Deno.test("GET /orders - Success: List all orders", async () => {
  const response = await fetch(`${BASE_URL}/orders`);
  const data = await response.json();
  
  assertEquals(response.status, 200);
  assertEquals(data.status, "success");
  assertNotEquals(data.data.orders.length, 0);
});

Deno.test("GET /orders - Success: Filter by date and recipient", async () => {
  const response = await fetch(
    `${BASE_URL}/orders?date=2024-03-21&recipient=Test`
  );
  const data = await response.json();
  
  assertEquals(response.status, 200);
  assertEquals(data.status, "success");
});

// GET /order/:id Tests
Deno.test("GET /order/:id - Success: Get single order", async () => {
  const orderId = await createTestOrder();
  const response = await fetch(`${BASE_URL}/order/${orderId}`);
  const data = await response.json();
  
  assertEquals(response.status, 200);
  assertEquals(data.status, "success");
  assertEquals(data.data.id, orderId);
});

Deno.test("GET /order/:id - Fail: Invalid ID", async () => {
  const response = await fetch(`${BASE_URL}/order/invalid`);
  const data = await response.json();
  
  assertEquals(response.status, 400);
  assertEquals(data.status, "error");
  assertEquals(data.code, "INVALID_ID");
});

Deno.test("GET /order/:id - Fail: Order not found", async () => {
  const response = await fetch(`${BASE_URL}/order/99999`);
  const data = await response.json();
  
  assertEquals(response.status, 404);
  assertEquals(data.status, "error");
  assertEquals(data.code, "NOT_FOUND");
});

// PUT /order/:id Tests
Deno.test("PUT /order/:id - Success: Update minimal fields", async () => {
  const orderId = await createTestOrder();
  const response = await fetch(`${BASE_URL}/order/${orderId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: "Updated User"
    })
  });
  const data = await response.json();
  
  assertEquals(response.status, 200);
  assertEquals(data.status, "success");
  assertEquals(data.data.recipient, "Updated User");
});

Deno.test("PUT /order/:id - Success: Update all fields", async () => {
  const orderId = await createTestOrder();
  const response = await fetch(`${BASE_URL}/order/${orderId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: "2024-03-22",
      recipient: "Updated User",
      items: [
        {
          product_name: "Updated Product",
          quantity: 2,
          description: "Updated Description",
          unit_price: 19.99,
          unit: "cases"
        }
      ]
    })
  });
  const data = await response.json();
  
  assertEquals(response.status, 200);
  assertEquals(data.status, "success");
  assertEquals(data.data.items[0].unit_price, 19.99);
});

// DELETE /order/:id Tests (run these last)
Deno.test("DELETE /order/:id - Success: Delete existing order", async () => {
  const orderId = await createTestOrder();
  const response = await fetch(`${BASE_URL}/order/${orderId}`, {
    method: "DELETE"
  });
  const data = await response.json();
  
  assertEquals(response.status, 200);
  assertEquals(data.status, "success");
});

Deno.test("DELETE /order/:id - Fail: Order not found", async () => {
  const response = await fetch(`${BASE_URL}/order/99999`, {
    method: "DELETE"
  });
  const data = await response.json();
  
  assertEquals(response.status, 404);
  assertEquals(data.status, "error");
});

// DELETE /order/:id/items Tests
Deno.test("DELETE /order/:id/items - Success: Delete single item", async () => {
  // Create a test order with multiple items
  const response = await fetch(`${BASE_URL}/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: "2024-03-21",
      recipient: "Test User",
      owner: "Test Owner",
      items: [
        { product_name: "Product 1", quantity: 1 },
        { product_name: "Product 2", quantity: 2 }
      ]
    })
  });
  const orderData = await response.json();
  console.log("Created order data:", orderData.data);
  const orderId = orderData.data.id;
  const itemId = orderData.data.items[0].id;

  // Delete one item
  const deleteResponse = await fetch(`${BASE_URL}/order/${orderId}/items`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      item_ids: [itemId]
    })
  });
  const deleteData = await deleteResponse.json();

  assertEquals(deleteResponse.status, 200);
  assertEquals(deleteData.status, "success");
  assertEquals(deleteData.data.deleted_items.length, 1);
  assertEquals(deleteData.data.deleted_items[0], itemId);

  // Verify the item was deleted
  const verifyResponse = await fetch(`${BASE_URL}/order/${orderId}`);
  const verifyData = await verifyResponse.json();
  assertEquals(verifyData.data.items.length, 1);
});

Deno.test("DELETE /order/:id/items - Success: Delete multiple items", async () => {
  // Create a test order with multiple items
  const response = await fetch(`${BASE_URL}/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: "2024-03-21",
      recipient: "Test User",
      owner: "Test Owner",
      items: [
        { product_name: "Product 1", quantity: 1 },
        { product_name: "Product 2", quantity: 2 },
        { product_name: "Product 3", quantity: 3 }
      ]
    })
  });
  const orderData = await response.json();
  const orderId = orderData.data.id;
  const itemIds = orderData.data.items.slice(0, 2).map((item: { id: number }) => item.id);

  // Delete multiple items
  const deleteResponse = await fetch(`${BASE_URL}/order/${orderId}/items`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      item_ids: itemIds
    })
  });
  const deleteData = await deleteResponse.json();

  assertEquals(deleteResponse.status, 200);
  assertEquals(deleteData.status, "success");
  assertEquals(deleteData.data.deleted_items.length, 2);

  // Verify the items were deleted
  const verifyResponse = await fetch(`${BASE_URL}/order/${orderId}`);
  const verifyData = await verifyResponse.json();
  assertEquals(verifyData.data.items.length, 1);
});

// Cleanup after all tests
Deno.test({
  name: "Cleanup database",
  fn: async () => {
    await db.execute("DELETE FROM order_items");
    await db.execute("DELETE FROM orders");
    console.log("Database cleaned up");
  },
  sanitizeResources: false,
  sanitizeOps: false
}); 