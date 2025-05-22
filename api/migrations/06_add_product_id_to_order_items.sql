-- Add product_id column to order_items table
ALTER TABLE order_items
ADD COLUMN product_id BIGINT NULL DEFAULT NULL AFTER subtotal;

-- Add foreign key constraint for product_id
ALTER TABLE order_items
ADD CONSTRAINT fk_order_items_product_id
FOREIGN KEY (product_id) REFERENCES products(id)
ON DELETE SET NULL;

-- Note on ON DELETE SET NULL:
-- This means if a product is deleted from the 'products' table,
-- the 'product_id' in any referencing 'order_items' rows will be set to NULL.
-- This can be useful for maintaining historical order item records even if products are removed.
-- Other options include ON DELETE RESTRICT (prevents product deletion if referenced)
-- or ON DELETE CASCADE (deletes order items if the product is deleted, usually not desired for orders).
