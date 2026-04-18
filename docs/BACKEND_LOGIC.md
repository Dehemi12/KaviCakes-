# KaviCakes Backend Logic & Architectural Documentation

## 1. Introduction
This document provides a comprehensive overview of the backend logic, architecture, and business rules implemented in the KaviCakes management system. The system is designed to handle retail cake orders, complex custom designs, and high-volume bulk orders with automated financial tracking and customer engagement.

### 🛠 Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma (Type-safe database client)
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens) & Bcrypt (Password Hashing)
- **Communications**: Nodemailer (GMAIL SMTP / SMTP Relay)
- **File Storage**: Hybrid Cloud & Local System
    - **Local Storage**: Currently used for all new uploads (Cakes, Payment Slips, Site Content) for low-latency development.
    - **Supabase Storage**: Legacy bucket (`cakes`) stores high-resolution historical assets and category images.
- **Scheduling**: Node-Cron (Automated background task management)

---

## 2. System Architecture
The backend follows a **Layered Pattern**:
1.  **Routes (`src/routes`)**: Defines API endpoints and attaches appropriate middlewares.
2.  **Middlewares (`src/middlewares`)**: Handles authentication (JWT), Role-Based Access Control (RBAC), and request validation.
3.  **Controllers (`src/controllers`)**: Contains the core business logic (The "Brain" of the system).
4.  **Utils (`src/utils`)**: Helper functions for email dispatching, invoice generation, and background jobs.
5.  **ORM Layer (`prisma`)**: Manages database schema and type-safe queries.

---

## 3. Database Schema Overview
The database is structured around the `orders` table, which acts as the central hub.

### Core Entities:
- **`customer`**: Stores user profiles, hashed passwords, and `loyaltyPoints`.
- **`orders`**: Tracks status, totals, payment details, and links to specialized order types.
- **`bulkorder` & `customorder`**: Extended data for specialized order types (e.g., event names, special instructions).
- **`cake`**: Main product catalog, categorized and variant-based.
- **`cakevariant`**: The "Stock Keeping Unit" (SKU) level, mapping specific Size + Shape + Flavor combinations to prices.
- **`payment`**: Tracks payment proof (bank slips) and verification timestamps.
- **`transaction` & `cashbook`**: Logs every financial event (income/expense) for daily auditing.
- **`notificationtemplate`**: Dynamic HTML email templates with placeholders.

---

## 4. Core Business Logic

### 🔐 4.1. Authentication & Security
- **Multi-Role System**: Supports `ADMIN` and `CUSTOMER` roles.
- **Verified Registration**: Users must verify their email via a 6-digit **OTP** before they can log in.
- **JWT Protection**: Secured routes require a valid token in the `Authorization` header.
- **Admin Singleton**: The system is configured to allow only **one primary admin account** for security.

### 🎂 4.2. Product & Pricing Engine
- **Variant Pricing**: Final price = (Category Base Price * Size Multiplier) + Flavor Premium.
- **Bulk Pricing**: Implements a "Threshold" system. If quantity > `bulkThreshold`, a lower `bulkPrice` is applied per unit.
- **Availability Guard**: Logic checks `isAvailable` flags on both the main product and specific variants before allowing them into a cart.

### 📦 4.3. Order Lifecycle Logic
This is the most complex part of the system, located in `orderController.js`.

| State | Description | Guardrails / Business Rules |
| :--- | :--- | :--- |
| **NEW** | Order created by customer. | Points capped at 30% of total. Urgency fee applied if delivery < 48hrs. |
| **CONFIRMED** | Admin acknowledged the order. | Triggers automated "Order Confirmed" email. |
| **PREPARING** | Kitchen starts work. | **Strict Guard**: Cannot start unless Advance (30%) or Full Payment is approved. |
| **READY** | Cake is boxed and ready. | Triggers notification for pickup/delivery. |
| **DELIVERED** | Customer received order. | Automatically generates a PDF Invoice and sends it to the customer's email. |

### 💳 4.4. Payment & Advance Logic
The system supports **COD (30% Advance)** and **Full Online Payment**.
- **Bank Slip Verification**: When a customer uploads a payment proof, the order enters a `PENDING_VERIFICATION` state.
- **Balance Tracking**: `total = advanceAmount + balanceAmount`. The `balanceAmount` is updated dynamically if order items are edited.
- **Manual Collection**: Admins can record "In-Person Cash" payments which directly update the `cashbook`.

### 🏆 4.5. Loyalty Point System
- **Earning**: Customers earn 1 point for every Rs.100 spent (calculated on the subtotal).
- **Spending**: Customers can redeem points as a discount.
- **Safety Rule**: Point redemption is capped at **30% of the gross total** to maintain profit margins.
- **Urgent Fee**: Urgent orders automatically deduct an additional **500 points** from the customer's balance as a priority processing fee.

---

## 5. Automated Intelligence (CRON Jobs)
The system runs background tasks every morning at 8:00 AM:
- **Payment Reminders**: Sends emails to customers with orders due in 2 days who haven't paid.
- **Last Chance to Edit**: Reminds customers with Custom/Bulk orders that they only have **2 days before delivery** to finalize changes.
- **Loyalty Cleanup**: Deducts points for cancelled orders where points were already utilized.

---

## 6. Financial Auditing
Every verified payment or manual transaction creates a `transaction` record.
- **Daily Cashbook**: The `cashbook` table aggregates these daily to show `totalIncome` vs `totalExpense`.
- **Closing Balance**: Each day's closing balance becomes the next day's opening balance, ensuring a continuous financial audit trail.

---

## 7. API Protection Layer (Middlewares)
- **`authMiddleware`**: Verifies JWT.
- **`isAdmin`**: Blocks customer IDs from accessing financial reports or system settings.
- **`uploadMiddleware`**: Handles multipart/form-data for images using Multer and Supabase.

---

### *End of Documentation*
