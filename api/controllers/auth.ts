import { Context } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { create, verify } from "https://deno.land/x/djwt@v2.9.1/mod.ts";
import db from "../db/db.ts";
import { CreateUserDTO, LoginDTO, User } from "../models/user.ts";
import { key } from "../utils/jwt.ts";
import * as AuthService from "../services/authService.ts";

export async function register(ctx: Context) {
  await AuthService.register(ctx);
}

export async function login(ctx: Context) {
  await AuthService.login(ctx);
}

export async function getMe(ctx: Context) {
  await AuthService.getMe(ctx);
} 