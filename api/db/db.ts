import { Client } from "https://deno.land/x/mysql/mod.ts";

const client = await new Client().connect({
  hostname: "127.0.0.1",
  username: "root",
  password: "chris",
  db: "order_management",
});

// Test the connection
try {
  const result = await client.execute("SELECT 1");
  console.log("Database connected successfully!");
} catch (err) {
  console.error("Failed to connect to database:", err);
}

export default client; 