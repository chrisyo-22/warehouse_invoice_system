-- Add invoice_number column to orders table
ALTER TABLE orders ADD COLUMN invoice_number VARCHAR(50);

-- Create index for faster lookups
CREATE INDEX idx_orders_invoice_number ON orders(invoice_number); 