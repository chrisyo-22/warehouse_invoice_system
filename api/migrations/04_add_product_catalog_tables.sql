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

-- Insert mock categories
INSERT INTO categories (name, description) VALUES
('Frozen Foods', 'Frozen items, including vegetables, meals, and desserts'),
('Fresh Produce', 'Fresh fruits and vegetables'),
('Bakery', 'Freshly baked bread, pastries, and cakes'),
('Beverages', 'Drinks, including juices, sodas, and water');

-- Insert mock products
-- Frozen Foods
INSERT INTO products (category_id, name, description, price, unit, image_url) VALUES
((SELECT id from categories WHERE name = 'Frozen Foods'), 'Frozen Peas', 'Sweet and tender frozen peas', 2.99, 'kg', 'images/frozen_peas.jpg'),
((SELECT id from categories WHERE name = 'Frozen Foods'), 'Ice Cream', 'Vanilla bean ice cream', 5.49, '1L', 'images/ice_cream.jpg'),
((SELECT id from categories WHERE name = 'Frozen Foods'), 'Frozen Pizza', 'Pepperoni pizza with a crispy crust', 7.99, 'piece', 'images/frozen_pizza.jpg');

-- Fresh Produce
INSERT INTO products (category_id, name, description, price, unit, image_url) VALUES
((SELECT id from categories WHERE name = 'Fresh Produce'), 'Apples', 'Crisp and juicy red apples', 3.50, 'kg', 'images/apples.jpg'),
((SELECT id from categories WHERE name = 'Fresh Produce'), 'Bananas', 'Ripe yellow bananas', 1.99, 'bunch', 'images/bananas.jpg'),
((SELECT id from categories WHERE name = 'Fresh Produce'), 'Carrots', 'Fresh organic carrots', 2.20, 'kg', 'images/carrots.jpg');

-- Bakery
INSERT INTO products (category_id, name, description, price, unit, image_url) VALUES
((SELECT id from categories WHERE name = 'Bakery'), 'Sourdough Bread', 'Artisan sourdough bread loaf', 4.50, 'loaf', 'images/sourdough.jpg'),
((SELECT id from categories WHERE name = 'Bakery'), 'Croissants', 'Buttery and flaky croissants', 1.75, 'piece', 'images/croissants.jpg'),
((SELECT id from categories WHERE name = 'Bakery'), 'Chocolate Cake', 'Rich dark chocolate cake', 15.00, 'cake', 'images/chocolate_cake.jpg');

-- Beverages
INSERT INTO products (category_id, name, description, price, unit, image_url) VALUES
((SELECT id from categories WHERE name = 'Beverages'), 'Orange Juice', 'Freshly squeezed orange juice', 3.99, '1L', 'images/orange_juice.jpg'),
((SELECT id from categories WHERE name = 'Beverages'), 'Sparkling Water', 'Natural sparkling mineral water', 1.50, '750ml', 'images/sparkling_water.jpg'),
((SELECT id from categories WHERE name = 'Beverages'), 'Cola', 'Classic cola flavor', 2.00, '2L', 'images/cola.jpg');
