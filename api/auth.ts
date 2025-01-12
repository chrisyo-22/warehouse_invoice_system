import { Router } from "https://deno.land/x/oak/mod.ts";
import { register, login } from "./controllers/auth.ts";

const router = new Router({ prefix: "/api/auth" });

router
  .post("/register", register)
  .post("/login", login);

export default router; 