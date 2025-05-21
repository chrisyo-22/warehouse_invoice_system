import db from "../db/db.ts"; // This is the Deno MySQL client instance

interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string; // Assuming ISO string format from DB
  updated_at: string; // Assuming ISO string format from DB
}

interface Product {
  id: number;
  category_id: number;
  name: string;
  description?: string;
  image_url?: string;
  price: number;
  unit?: string;
  created_at: string; // Assuming ISO string format from DB
  updated_at: string; // Assuming ISO string format from DB
}

/**
 * Fetches all categories from the database.
 */
export async function getAllCategories(): Promise<Category[]> {
  try {
    const result = await db.execute("SELECT * FROM categories");
    return result.rows as Category[];
  } catch (error) {
    console.error("Error fetching all categories:", error);
    throw new Error("Database error while fetching categories.");
  }
}

/**
 * Fetches products, optionally filtered by categoryId.
 * If categoryId is not provided, returns all products.
 * @param categoryId - Optional ID of the category to filter products by.
 */
export async function getProducts(categoryId?: number): Promise<Product[]> {
  try {
    if (categoryId !== undefined) {
      const result = await db.execute("SELECT * FROM products WHERE category_id = ?", [categoryId]);
      return result.rows as Product[];
    } else {
      const result = await db.execute("SELECT * FROM products");
      return result.rows as Product[];
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Database error while fetching products.");
  }
}

/**
 * Fetches a single product by its ID.
 * @param productId - The ID of the product to fetch.
 */
export async function getProductById(productId: number): Promise<Product | null> {
  try {
    const result = await db.execute("SELECT * FROM products WHERE id = ?", [productId]);
    if (result.rows && result.rows.length > 0) {
      return result.rows[0] as Product;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching product with ID ${productId}:`, error);
    throw new Error("Database error while fetching product by ID.");
  }
}
