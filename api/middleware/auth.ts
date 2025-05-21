import { Context, Next } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { verify } from "https://deno.land/x/djwt@v2.9.1/mod.ts";
import db from "../db/db.ts";
import { key } from "../utils/jwt.ts";

export async function authMiddleware(ctx: Context, next: Next) {
  try {
    // Get the Authorization header
    const authHeader = ctx.request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ctx.response.status = 401;
      ctx.response.body = { message: "No token provided" };
      return;
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    try {
      // Verify the token
      const payload = await verify(token, key);
      
      if (!payload.sub) {
        throw new Error('Invalid token payload');
      }

      // Get user from database
      const result = await db.execute(
        "SELECT id, email, company_name, address, postal_code, province FROM users WHERE id = ?",
        [payload.sub]
      );

      if (result.rows.length === 0) {
        ctx.response.status = 401;
        ctx.response.body = { message: "User not found" };
        return;
      }

      // Attach user to context state
      ctx.state.user = result.rows[0];
      
      await next();
    } catch (error) {
      console.error('Token verification error:', error);
      ctx.response.status = 401;
      ctx.response.body = { message: "Invalid token" };
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    ctx.response.status = 500;
    ctx.response.body = { message: "Internal server error" };
  }
} 