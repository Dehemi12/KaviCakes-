-- Database Creation
CREATE DATABASE IF NOT EXISTS kavicakes;
USE kavicakes;

-- 1. Users & Auth
CREATE TABLE Customer (
    id VARCHAR(191) PRIMARY KEY,
    displayId VARCHAR(191) UNIQUE NOT NULL, -- C001, C002
    name VARCHAR(191) NOT NULL,
    email VARCHAR(191) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Hashed
    phone VARCHAR(191),
    address VARCHAR(191),
    loyaltyPoints INT DEFAULT 0,
    isActive BOOLEAN DEFAULT TRUE,
    isVerified BOOLEAN DEFAULT FALSE,
    otp VARCHAR(191),
    otpExpiresAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE Admin (
    id VARCHAR(191) PRIMARY KEY, -- UUID
    email VARCHAR(191) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(191),
    role VARCHAR(50) DEFAULT 'ADMIN',
    isActive BOOLEAN DEFAULT TRUE,
    isVerified BOOLEAN DEFAULT FALSE,
    otp VARCHAR(191),
    otpExpiresAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Master Data (Product Attributes)
CREATE TABLE CakeCategory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(191) UNIQUE NOT NULL,
    basePrice DECIMAL(65, 30) DEFAULT 0
);

CREATE TABLE CakeSize (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(191) UNIQUE NOT NULL, -- 1kg, 2kg
    price DECIMAL(65, 30) DEFAULT 0 -- Extra cost
);

CREATE TABLE CakeShape (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(191) UNIQUE NOT NULL, -- Round, Square
    price DECIMAL(65, 30) DEFAULT 0
);

CREATE TABLE CakeFlavor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(191) UNIQUE NOT NULL, -- Chocolate, Vanilla
    price DECIMAL(65, 30) DEFAULT 0
);

-- 3. Products
CREATE TABLE Cake (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    description TEXT,
    availability BOOLEAN DEFAULT TRUE,
    ingredients TEXT,
    imageUrl VARCHAR(191),
    categoryId INT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoryId) REFERENCES CakeCategory(id) ON DELETE RESTRICT
);

CREATE TABLE CakeVariant (
    id INT AUTO_INCREMENT PRIMARY KEY,
    price DECIMAL(65, 30) NOT NULL, -- Final calculated price for this specific combo
    cakeId INT NOT NULL,
    sizeId INT NOT NULL,
    shapeId INT NOT NULL,
    flavorId INT NOT NULL,
    isAvailable BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cakeId) REFERENCES Cake(id) ON DELETE CASCADE,
    FOREIGN KEY (sizeId) REFERENCES CakeSize(id),
    FOREIGN KEY (shapeId) REFERENCES CakeShape(id),
    FOREIGN KEY (flavorId) REFERENCES CakeFlavor(id),
    UNIQUE KEY unique_variant (cakeId, sizeId, shapeId, flavorId)
);

-- 4. Cart & Shopping
CREATE TABLE Cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customerId VARCHAR(191) NOT NULL,
    status VARCHAR(191) DEFAULT 'ACTIVE',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES Customer(id)
);

CREATE TABLE CartItem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cartId INT NOT NULL,
    variantId INT NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (cartId) REFERENCES Cart(id) ON DELETE CASCADE,
    FOREIGN KEY (variantId) REFERENCES CakeVariant(id)
);

-- 5. Orders & Transactions
CREATE TABLE Orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total DECIMAL(65, 30) NOT NULL,
    loyaltyDiscount DECIMAL(65, 30) DEFAULT 0,
    status VARCHAR(191) DEFAULT 'NEW', -- NEW, CONFIRMED, PREPARING, DELIVERED
    orderType VARCHAR(191), -- REGULAR, CUSTOM, BULK
    specialNotes TEXT,
    paymentStatus VARCHAR(191) DEFAULT 'PENDING',
    paymentMethod VARCHAR(191) DEFAULT 'COD',
    customerId VARCHAR(191) NOT NULL,
    address VARCHAR(191) DEFAULT '',
    deliveryDate DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES Customer(id)
);

CREATE TABLE OrderItem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT NOT NULL,
    variantId INT,
    quantity INT NOT NULL,
    unitPrice DECIMAL(65, 30) NOT NULL,
    FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE CASCADE,
    FOREIGN KEY (variantId) REFERENCES CakeVariant(id)
);

-- 6. Order Extensions
CREATE TABLE Delivery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT UNIQUE NOT NULL,
    recipientName VARCHAR(191),
    phoneNumber VARCHAR(191),
    email VARCHAR(191),
    address TEXT,
    deliveryMethod VARCHAR(191),
    distanceKm DECIMAL(6, 2),
    deliveryFee DECIMAL(65, 30) DEFAULT 0,
    FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE CASCADE
);

CREATE TABLE Payment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT UNIQUE NOT NULL,
    paymentMethod VARCHAR(191),
    paymentStatus VARCHAR(191),
    proofImage VARCHAR(191),
    verifiedAt DATETIME,
    FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE CASCADE
);

CREATE TABLE Invoice (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT UNIQUE NOT NULL,
    invoiceNumber VARCHAR(191),
    issuedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE CASCADE
);

CREATE TABLE CustomOrder (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT UNIQUE NOT NULL,
    sizeId INT,
    flavorId INT,
    shapeId INT,
    quantity INT,
    specialInstructions TEXT,
    calculatedPrice DECIMAL(65, 30),
    FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE CASCADE
);

CREATE TABLE BulkOrder (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT UNIQUE NOT NULL,
    eventName VARCHAR(191),
    organization VARCHAR(191),
    quantity INT,
    notes TEXT,
    FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE CASCADE
);

-- 7. Feedback & Ratings
CREATE TABLE ItemRating (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderItemId INT UNIQUE NOT NULL,
    stars INT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orderItemId) REFERENCES OrderItem(id) ON DELETE CASCADE
);

CREATE TABLE Feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rating INT NOT NULL,
    title VARCHAR(191),
    comment TEXT,
    status VARCHAR(191) DEFAULT 'PENDING',
    customerId VARCHAR(191) NOT NULL,
    orderId INT UNIQUE NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES Customer(id),
    FOREIGN KEY (orderId) REFERENCES Orders(id)
);


-- 8. Financials & Loyalty
CREATE TABLE CashBook (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    openingBalance DECIMAL(10, 2),
    closingBalance DECIMAL(10, 2),
    totalIncome DECIMAL(10, 2) DEFAULT 0,
    totalExpense DECIMAL(10, 2) DEFAULT 0
);

CREATE TABLE Transaction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(191) NOT NULL, -- INCOME, EXPENSE
    category VARCHAR(191),
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(191),
    cashBookId INT,
    paymentId INT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cashBookId) REFERENCES CashBook(id),
    FOREIGN KEY (paymentId) REFERENCES Payment(id)
);

CREATE TABLE LoyaltyTransaction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customerId VARCHAR(191) NOT NULL,
    orderId INT,
    pointsEarned INT DEFAULT 0,
    pointsRedeemed INT DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE CASCADE
);

-- 9. Notifications & Events
CREATE TABLE Notification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(191) NOT NULL,
    message VARCHAR(191) NOT NULL,
    type VARCHAR(191) DEFAULT 'SYSTEM',
    isRead BOOLEAN DEFAULT FALSE,
    metadata JSON,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE NotificationTemplate (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(191) NOT NULL,
    category VARCHAR(191) NOT NULL,
    body TEXT NOT NULL,
    lastUsed DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Event (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(191) NOT NULL,
    description VARCHAR(191),
    startTime DATETIME NOT NULL,
    endTime DATETIME,
    type VARCHAR(191) NOT NULL,
    category VARCHAR(191),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE BulkPricing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoryLabel VARCHAR(191) UNIQUE NOT NULL,
    basePrice DECIMAL(65, 30) NOT NULL,
    bulkPrice DECIMAL(65, 30) NOT NULL,
    bulkThreshold INT DEFAULT 100,
    minOrderQty INT DEFAULT 50,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
