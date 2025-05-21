-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    price REAL NOT NULL DEFAULT 0.0,
    unit TEXT, -- e.g., 'kg', 'lbs', 'piece'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

INSERT INTO categories (name, description) VALUES
('Frozen Foods', 'Frozen items, including vegetables, meals, and desserts'),
('Fresh Produce', 'Fresh fruits and vegetables'),
('Bakery', 'Freshly baked bread, pastries, and cakes'),
('Beverages', 'Drinks, including juices, sodas, and water'),
('Dry Goods', 'Pantry staples and dry groceries');

INSERT INTO products (category_id, name, description, price, unit, image_url) VALUES
(1, 'Frozen Peas', 'Sweet and tender frozen peas', 2.99, 'kg', 'images/frozen_peas.jpg'),
(1, 'Ice Cream', 'Vanilla bean ice cream', 5.49, '1L', 'images/ice_cream.jpg'),
(2, 'Apples', 'Crisp and juicy red apples', 3.50, 'kg', 'images/apples.jpg'),
(3, 'Sourdough Bread', 'Artisan sourdough bread loaf', 4.50, 'loaf', 'images/sourdough.jpg'),
(4, 'Orange Juice', 'Freshly squeezed orange juice', 3.99, '1L', 'images/orange_juice.jpg'),
(5, 'Pasta', 'Imported Italian spaghetti, 500g.', 2.10, '500g', 'images/pasta.jpg');