-- Create Database
CREATE DATABASE IF NOT EXISTS pos_restaurant_pool;
USE pos_restaurant_pool;

-- Users Table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('admin', 'staff', 'user') DEFAULT 'user',
    status ENUM('active', 'inactive') DEFAULT 'active',
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table Groups
CREATE TABLE table_groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tables
CREATE TABLE tables (
    id INT PRIMARY KEY AUTO_INCREMENT,
    table_number VARCHAR(20) NOT NULL UNIQUE,
    table_name VARCHAR(100) NOT NULL,
    table_type ENUM('restaurant', 'pool', 'snooker', 'playstation', 'dining') NOT NULL,
    group_id INT,
    capacity INT DEFAULT 4,
    hourly_rate DECIMAL(10,2) NOT NULL,
    status ENUM('available', 'occupied', 'reserved', 'maintenance') DEFAULT 'available',
    location VARCHAR(100),
    plug_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES table_groups(id) ON DELETE SET NULL
);

-- Menu Categories
CREATE TABLE menu_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Menu Items
CREATE TABLE menu_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    status ENUM('available', 'unavailable') DEFAULT 'available',
    printer_id VARCHAR(50),
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE
);

-- Sessions
CREATE TABLE sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    table_id INT NOT NULL,
    user_id INT,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    duration_minutes INT DEFAULT 0,
    hourly_rate DECIMAL(10,2) NOT NULL,
    session_cost DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('active', 'paused', 'completed', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Orders
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    session_id INT,
    table_id INT NOT NULL,
    user_id INT,
    customer_name VARCHAR(100),
    order_type ENUM('dine_in', 'takeaway') DEFAULT 'dine_in',
    subtotal DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled') DEFAULT 'pending',
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Order Items
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    status ENUM('pending', 'preparing', 'ready', 'served') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- Reservations
CREATE TABLE reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reservation_id VARCHAR(100) UNIQUE NOT NULL,
    table_id INT NOT NULL,
    user_id INT,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(100),
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    duration_hours INT DEFAULT 2,
    party_size INT DEFAULT 1,
    special_requests TEXT,
    status ENUM('confirmed', 'arrived', 'cancelled', 'no_show') DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Payments
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payment_id VARCHAR(100) UNIQUE NOT NULL,
    session_id INT,
    order_id INT,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'card', 'upi', 'wallet') NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- Printers
CREATE TABLE printers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    printer_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('kitchen', 'bar', 'receipt') NOT NULL,
    ip_address VARCHAR(45),
    port INT DEFAULT 9100,
    status ENUM('online', 'offline', 'error') DEFAULT 'offline',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Smart Plugs
CREATE TABLE smart_plugs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plug_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    table_id INT,
    ip_address VARCHAR(45),
    mac_address VARCHAR(17),
    status ENUM('online', 'offline') DEFAULT 'offline',
    power_state ENUM('on', 'off') DEFAULT 'off',
    power_consumption DECIMAL(8,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL
);

-- Permissions
CREATE TABLE permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role Permissions
CREATE TABLE role_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role ENUM('admin', 'staff', 'user') NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Insert Default Data
INSERT INTO table_groups (name, description) VALUES
('Restaurant Area', 'Main dining area tables'),
('Gaming Zone', 'Pool and snooker tables'),
('PlayStation Zone', 'Gaming console area'),
('VIP Section', 'Premium dining and gaming area');

INSERT INTO tables (table_number, table_name, table_type, group_id, capacity, hourly_rate, location) VALUES
('R01', 'Restaurant Table 1', 'restaurant', 1, 4, 8.00, 'Main Floor'),
('R02', 'Restaurant Table 2', 'restaurant', 1, 2, 8.00, 'Main Floor'),
('R03', 'Restaurant Table 3', 'restaurant', 1, 6, 8.00, 'Main Floor'),
('P01', 'Pool Table 1', 'pool', 2, 4, 12.00, 'Gaming Zone'),
('P02', 'Pool Table 2', 'pool', 2, 4, 12.00, 'Gaming Zone'),
('S01', 'Snooker Table 1', 'snooker', 2, 4, 15.00, 'Gaming Zone'),
('PS01', 'PlayStation 1', 'playstation', 3, 4, 20.00, 'Gaming Zone'),
('PS02', 'PlayStation 2', 'playstation', 3, 4, 20.00, 'Gaming Zone'),
('VIP01', 'VIP Table 1', 'dining', 4, 8, 25.00, 'VIP Section');

INSERT INTO menu_categories (name, description) VALUES
('Pizza', 'Fresh baked pizzas'),
('Burgers', 'Gourmet burgers'),
('Beverages', 'Cold and hot drinks'),
('Snacks', 'Light snacks and appetizers'),
('Main Course', 'Full meals');

INSERT INTO menu_items (name, description, category_id, price, printer_id) VALUES
('Margherita Pizza', 'Fresh basil and mozzarella', 1, 18.50, 'KITCHEN_01'),
('Pepperoni Pizza', 'Classic pepperoni with cheese', 1, 19.99, 'KITCHEN_01'),
('Chicken Burger', 'Crispy chicken with fresh lettuce', 2, 12.99, 'KITCHEN_01'),
('Cheeseburger', 'Classic beef with cheese', 2, 11.50, 'KITCHEN_01'),
('Coca Cola', 'Refreshing cola drink', 3, 3.50, 'BAR_01'),
('Coffee', 'Premium blend coffee', 3, 4.50, 'BAR_01'),
('French Fries', 'Crispy golden fries', 4, 5.99, 'KITCHEN_01'),
('Chicken Wings', 'Spicy buffalo wings', 4, 8.99, 'KITCHEN_01');

INSERT INTO printers (printer_id, name, type, status) VALUES
('KITCHEN_01', 'Kitchen Printer 1', 'kitchen', 'online'),
('BAR_01', 'Bar Printer 1', 'bar', 'online'),
('RECEIPT_01', 'Receipt Printer 1', 'receipt', 'online');

INSERT INTO permissions (name, description) VALUES
('manage_users', 'Create, update, delete users'),
('manage_tables', 'Manage table operations'),
('manage_orders', 'Create and manage orders'),
('manage_menu', 'Manage menu items and categories'),
('manage_reservations', 'Handle reservations'),
('view_reports', 'Access reports and analytics'),
('manage_printers', 'Configure printers'),
('manage_plugs', 'Control smart plugs'),
('manage_billing', 'Handle billing and payments'),
('manage_sessions', 'Control table sessions');

INSERT INTO role_permissions (role, permission_id) VALUES
-- Admin permissions (all)
('admin', 1), ('admin', 2), ('admin', 3), ('admin', 4), ('admin', 5),
('admin', 6), ('admin', 7), ('admin', 8), ('admin', 9), ('admin', 10),
-- Staff permissions (limited)
('staff', 2), ('staff', 3), ('staff', 5), ('staff', 9), ('staff', 10),
-- User permissions (very limited)
('user', 5);

-- Create default admin user (password: admin123)
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');