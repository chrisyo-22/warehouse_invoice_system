import { Application } from "https://deno.land/x/oak/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { load } from "https://deno.land/std/dotenv/mod.ts";
import orderRouter from "./order.ts";
import catalogRouter from "./catalog.ts";
import authRouter from "./auth.ts";
import db from "./db/db.ts";

// Load environment variables from .env file
await load({ export: true });

const app = new Application();

app.use(oakCors());

// Webhook endpoint
app.use(async (context, next) => {
  if (context.request.url.pathname === "/webhook" && context.request.method === "POST") {
    if (context.request.hasBody) {
      try {
        const result = await context.request.body().value;
        const fromNumber = result.get("From")?.toString();
        const messageBody = result.get("Body")?.toString();

        console.log("Received Message");
        console.log(`From: ${fromNumber}, Body: ${messageBody}`);

        // Here you can process the message and create an order if needed
        // Example: if messageBody contains order information
        // await createOrderFromMessage(messageBody);

        const twimlResponse = `<Response></Response>`;
        context.response.status = 200;
        context.response.headers.set("Content-Type", "application/xml");
        context.response.body = twimlResponse;
      } catch (error) {
        console.error("Error processing Twilio webhook:", error);
        context.response.status = 500;
        context.response.body = "Internal Server Error!";
      }
    } else {
      context.response.status = 400;
      context.response.body = "No body received!";
    }
  } else {
    await next();
  }
});

// Use auth routes
app.use(authRouter.routes());
app.use(authRouter.allowedMethods());

// Use order routes
app.use(orderRouter.routes());
app.use(orderRouter.allowedMethods());

// Use catalog routes
catalogRouter.prefix('/api');
app.use(catalogRouter.routes());
app.use(catalogRouter.allowedMethods());

// Start the server
console.log("Server running on http://localhost:8000");
await app.listen({ port: 8000 });
