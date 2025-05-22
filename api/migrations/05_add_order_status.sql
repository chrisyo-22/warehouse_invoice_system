-- Add status column to orders table
ALTER TABLE orders
ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending' AFTER original_message;

-- Note: Changed default to 'pending' as it's a common starting status for orders.
-- Other common statuses could be 'processing', 'shipped', 'delivered', 'cancelled', 'active'.
-- 'active' was suggested, but 'pending' often makes more sense for new orders.
-- If existing orders should be 'active', a separate UPDATE query might be needed.
-- For this migration, 'pending' is a safe default for new rows.

-- Ensure any existing rows (if any were NULL despite the default) are set to 'pending'
UPDATE orders SET status = 'pending' WHERE status IS NULL;
