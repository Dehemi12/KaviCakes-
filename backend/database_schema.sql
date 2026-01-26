CREATE DATABASE IF NOT EXISTS kavicakes_db;
USE kavicakes_db;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50),
    status VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    address TEXT,
    status VARCHAR(20),
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_account (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    account_status VARCHAR(20),
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);

CREATE TABLE IF NOT EXISTS loyalty_account (
    loyalty_account_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT UNIQUE NOT NULL,
    point_balance INT DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);

CREATE TABLE IF NOT EXISTS loyalty_transaction (
    loyalty_tx_id INT AUTO_INCREMENT PRIMARY KEY,
    loyalty_account_id INT NOT NULL,
    order_id INT,
    points_earned INT DEFAULT 0,
    points_redeemed INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loyalty_account_id) REFERENCES loyalty_account(loyalty_account_id)
);

CREATE TABLE IF NOT EXISTS cake_category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    status VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS cake (
    cake_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    cake_name VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES cake_category(category_id)
);

CREATE TABLE IF NOT EXISTS cake_size (
    size_id INT AUTO_INCREMENT PRIMARY KEY,
    size_label VARCHAR(50),
    additional_price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS cake_flavor (
    flavor_id INT AUTO_INCREMENT PRIMARY KEY,
    flavor_name VARCHAR(50),
    additional_price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS cake_shape (
    shape_id INT AUTO_INCREMENT PRIMARY KEY,
    shape_name VARCHAR(50),
    additional_price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS cake_variant (
    variant_id INT AUTO_INCREMENT PRIMARY KEY,
    cake_id INT NOT NULL,
    size_id INT NOT NULL,
    flavor_id INT NOT NULL,
    shape_id INT NOT NULL,
    final_price DECIMAL(10,2) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (cake_id) REFERENCES cake(cake_id),
    FOREIGN KEY (size_id) REFERENCES cake_size(size_id),
    FOREIGN KEY (flavor_id) REFERENCES cake_flavor(flavor_id),
    FOREIGN KEY (shape_id) REFERENCES cake_shape(shape_id),
    UNIQUE (cake_id, size_id, flavor_id, shape_id)
);

CREATE TABLE IF NOT EXISTS cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    status VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);

CREATE TABLE IF NOT EXISTS cart_item (
    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    variant_id INT NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES cart(cart_id),
    FOREIGN KEY (variant_id) REFERENCES cake_variant(variant_id)
);

CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_type VARCHAR(20),
    order_status VARCHAR(30),
    payment_status VARCHAR(30),
    delivery_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);

CREATE TABLE IF NOT EXISTS order_item (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    variant_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2),
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (variant_id) REFERENCES cake_variant(variant_id)
);

CREATE TABLE IF NOT EXISTS custom_order (
    custom_order_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    size_id INT,
    flavor_id INT,
    shape_id INT,
    quantity INT,
    special_instructions TEXT,
    calculated_price DECIMAL(10,2),
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE IF NOT EXISTS bulk_order (
    bulk_order_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    event_name VARCHAR(100),
    organization VARCHAR(100),
    quantity INT,
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE IF NOT EXISTS delivery (
    delivery_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    recipient_name VARCHAR(100),
    phone_number VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    delivery_method VARCHAR(50),
    distance_km DECIMAL(6,2),
    delivery_fee DECIMAL(10,2),
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE IF NOT EXISTS payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method VARCHAR(20),
    payment_status VARCHAR(30),
    proof_image VARCHAR(255),
    verified_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE IF NOT EXISTS cash_book (
    cash_book_id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE,
    opening_balance DECIMAL(10,2),
    closing_balance DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS financial_transaction (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    cash_book_id INT,
    payment_id INT,
    transaction_type VARCHAR(20),
    amount DECIMAL(10,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cash_book_id) REFERENCES cash_book(cash_book_id),
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
);

CREATE TABLE IF NOT EXISTS rating (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    order_item_id INT NOT NULL,
    stars INT CHECK (stars BETWEEN 1 AND 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_item_id) REFERENCES order_item(order_item_id)
);

CREATE TABLE IF NOT EXISTS feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    customer_id INT,
    message TEXT,
    status VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);

CREATE TABLE IF NOT EXISTS notification (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_type VARCHAR(20),
    user_id INT,
    title VARCHAR(100),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    invoice_number VARCHAR(50),
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE IF NOT EXISTS schedule (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100),
    event_date DATE,
    description TEXT
);

SET FOREIGN_KEY_CHECKS = 1;
