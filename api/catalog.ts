import { Router, Context } from "https://deno.land/x/oak/mod.ts";
import { getAllCategories, getProducts, getProductById } from "./services/catalogService.ts";

// Create router
const catalogRouter = new Router();

// GET /categories - List all categories
catalogRouter.get("/categories", async (ctx: Context) => {
  try {
    const categories = await getAllCategories();
    ctx.response.status = 200;
    ctx.response.body = categories;
  } catch (error) {
    console.error("Error in /categories route:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error while fetching categories." };
  }
});

// GET /products - List all products or products by category_id
catalogRouter.get("/products", async (ctx: Context) => {
  try {
    const categoryIdParam = ctx.request.url.searchParams.get("category_id");
    let categoryId: number | undefined = undefined;

    if (categoryIdParam) {
      categoryId = parseInt(categoryIdParam, 10);
      if (isNaN(categoryId)) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Invalid category_id parameter. Must be a number." };
        return;
      }
    }

    const products = await getProducts(categoryId);
    ctx.response.status = 200;
    ctx.response.body = products;
  } catch (error) {
    console.error("Error in /products route:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error while fetching products." };
  }
});

// GET /products/:id - Get single product by id
catalogRouter.get("/products/:id", async (ctx: Context) => {
  try {
    const id = parseInt(ctx.params.id, 10);
    if (isNaN(id)) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid product ID parameter. Must be a number." };
      return;
    }

    const product = await getProductById(id);

    if (product) {
      ctx.response.status = 200;
      ctx.response.body = product;
    } else {
      ctx.response.status = 404;
      ctx.response.body = { error: "Product not found." };
    }
  } catch (error) {
    console.error("Error in /products/:id route:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error while fetching product." };
  }
});

export default catalogRouter;
