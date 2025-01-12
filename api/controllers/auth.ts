import { Context } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { create } from "https://deno.land/x/djwt@v2.9.1/mod.ts";
import db from "../db.ts";
import { CreateUserDTO, LoginDTO, User } from "../models/user.ts";
import { key } from "../utils/jwt.ts";

export async function register(ctx: Context) {
  try {
    const body = await ctx.request.body.json();
    const { email, password, company_name, address, postal_code, province, telephone } = body;

    // Validate required fields
    if (!email || !password || !company_name || !address || !postal_code || !province || !telephone) {
      ctx.response.status = 400;
      ctx.response.body = {
        status: "error",
        message: "All fields are required",
        code: "MISSING_FIELDS"
      };
      return;
    }

    // Check if user already exists
    const existingUser = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.rows.length > 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        status: "error",
        message: "User already exists",
        code: "USER_EXISTS"
      };
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password);

    // Generate UUID for user
    const userId = crypto.randomUUID();

    // Create user
    await db.execute(
      `INSERT INTO users (id, email, password, company_name, address, postal_code, province, telephone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, email, hashedPassword, company_name, address, postal_code, province, telephone]
    );

    // Create JWT token
    const token = await create(
      { alg: "HS512", typ: "JWT" },
      { sub: userId, email },
      key
    );

    // Return user data and token
    ctx.response.body = {
      status: "success",
      data: {
        user: {
          id: userId,
          email,
          company_name,
          address,
          postal_code,
          province,
          telephone
        },
        token
      }
    };
  } catch (error) {
    console.error("Registration error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      status: "error",
      message: "Internal server error",
      code: "SERVER_ERROR"
    };
  }
}

export async function login(ctx: Context) {
  try {
    const body = await ctx.request.body.json();
    const { email, password } = body as LoginDTO;

    // Find user by email
    const result = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (result.rows.length === 0) {
      ctx.response.status = 401;
      ctx.response.body = { message: "Invalid credentials" };
      return;
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      ctx.response.status = 401;
      ctx.response.body = { message: "Invalid credentials" };
      return;
    }

    // Remove password from user object
    delete user.password;

    // Generate JWT token
    const token = await create({ alg: "HS512", typ: "JWT" }, { sub: user.id, exp: Date.now() + 24*60*60*1000 }, key);

    ctx.response.body = {
      token,
      user
    };
  } catch (error) {
    console.error("Login error:", error);
    ctx.response.status = 500;
    ctx.response.body = { message: "Internal server error", error: error.message };
  }
} 