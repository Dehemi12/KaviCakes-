# 🔐 KaviCakes Authentication Master Plan

This document outlines the complete authentication strategy for the KaviCakes platform, covering both the **Admin Panel** (staff/owners) and **Customer Website** (shoppers).

---

## 🛠️ Technology Stack

We use industry-standard secure technologies to ensure data integrity and user safety.

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Database** | **MySQL** (via Prisma) | Stores user credentials (hashed) and profile data. |
| **Password Security** | **Bcrypt.js** | Hashes passwords before storage. *Never store plain text passwords.* |
| **Session Management** | **JWT** (JSON Web Token) | Stateless authentication. The server issues a "Badge" (Token) that the client shows with every request. |
| **Email Service** | **Nodemailer** | Sends OTPs and Password Reset links. |
| **Frontend State** | **React Context API** | Keeps the user "Logged In" across different pages without reloading data constantly. |
| **API Clients** | **Axios Interceptors** | Automatically attaches the `Authorization: Bearer <token>` header to every API call. |

---

## 👮 Admin Authentication (Internal Staff)

The Admin side is stricter. Registration is usually restricted (only one Super Admin or created by another Admin), and security is paramount.

### 1. Admin Login Flow
1. **Input**: User enters `Email` + `Password`.
2. **Backend**: 
   - Finds user in `Admin` table. 
   - Compares password hash using `bcrypt.compare()`.
   - Checks `isActive` (is account banned?) and `role`.
3. **Success**: Returns a **JWT Token** + User Info.
4. **Frontend**: Stores Token in `localStorage`, updates `AuthContext`, and redirects to Dashboard.

### 2. Forgot Password
1. **Request**: Admin enters email.
2. **Backend**: Checks if email exists. Generates a temporary **Reset Token** (valid for 1 hour).
3. **Email**: Sends a unique link: `admin.kavicakes.com/reset-password?token=xyz...`
4. **Reset**: Admin clicks link -> Enters new password -> Backend updates DB.

---

## 🛒 Customer Authentication (Shoppers)

Customers need a frictionless experience but must be verified to prevent spam/fake orders (especially for COD).

### 1. Registration (Sign Up) with OTP
1. **Input**: Name, Email, Password, Phone.
2. **Backend**: 
   - Checks if email already exists.
   - Hashes password.
   - Generates a **6-digit random OTP**.
   - **Saves User** with `isVerified = false`.
   - Sends email via Nodemailer: *"Your code is 123456"*.
3. **Frontend**: Redirects to **OTP Verification Page**.

### 2. Verification
1. **Input**: User enters `123456`.
2. **Backend**: Checks database: Matches OTP and checks expiration (10 mins).
3. **Success**: Updates user to `isVerified = true`.
4. **Result**: User can now log in.

### 3. Customer Login
*Same mechanism as Admin Login, but queries the `Customer` table.*

---

## 🔄 Data Flow Summary

### Login Request
```mermaid
[Frontend UI] --(Email, Password)--> [Backend API]
                                          |
                                    [Database Check]
                                          |
                                   (Password Match?)
                                          |
[Frontend Store] <--(JWT Token)-- [Generate Token]
```

### Protected Data Request (e.g., View Orders)
```mermaid
[Frontend UI] --(Header: Bearer eyJhbG...)--> [Backend Middleware]
                                                    |
                                             [Verify Token]
                                                    |
                                            (Valid & Not Expired?)
                                                    |
[Show Data] <--(JSON Data)-- [Execute Controller]
```

## 🛡️ Security Best Practices Implemented

1.  **Rate Limiting** (Recommended): Prevent brute-force attacks on Login API.
2.  **Separate Tables**: `Admin` and `Customer` data is strictly separated. An admin cannot accidentally log in as a customer, and vice-versa (unless logic explicitly allows).
3.  **Token Expiration**: Access tokens expire in **1 Day**. This limits damage if a token is stolen.
4.  **Middleware Protection**: Backend routes are protected by `authMiddleware.js`. If a request arrives without a valid token, it is rejected immediately with `401 Unauthorized`.
