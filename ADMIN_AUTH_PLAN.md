# Admin Authentication System - Master Plan

Based on the requirements provided, this is the definitive plan for securing the Admin Authentication system.

## 1. Core Security Principles
- **Strict Single Admin Policy:** The system allows exactly **ONE** admin account to exist.
- **No Hardcoded Credentials:** Credentials must never be stored in source code.
- **Mandatory Verification:** The initial admin account must be verified via Email OTP before access is granted.
- **Role-Based Access:** All admin routes protected by JWT with role checks.

## 2. Database Schema Changes (`Admin` Model)
To support OTP verification and security states, we will update the `Admin` model in `schema.prisma`:

```prisma
model Admin {
  id           String    @id @default(uuid())
  email        String    @unique
  password     String
  name         String?
  role         String    @default("ADMIN")
  isActive     Boolean   @default(true)      // Can be toggled manually in DB if needed
  isVerified   Boolean   @default(false)     // NEW: Requires OTP verification
  otp          String?                       // NEW: For registration/verification
  otpExpiresAt DateTime?                     // NEW: Expiry for OTP
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

## 3. Workflow Specifications

### A. Admin Registration (One-Time Setup)
**Endpoint:** `POST /api/auth/register`

1.  **Pre-Check:** Query database for `Admin` count.
2.  **Block Condition:** If `count > 0`, return `403 Forbidden` ("Admin configuration already complete.").
3.  **Creation:**
    *   Validate email/password strength.
    *   Hash Password (`bcrypt`).
    *   Generate 6-digit OTP (expires in 10 mins).
    *   Create record with `isVerified: false`.
4.  **Action:** Send OTP to the provided email.

### B. Admin Verification
**Endpoint:** `POST /api/auth/verify-otp`

1.  **Input:** `{ email, otp }`
2.  **Logic:**
    *   Find Admin by email.
    *   Check if `otp` matches and is not expired.
3.  **Action:** Update `isVerified = true`, `otp = null`.
4.  **Result:** Admin can now log in.

### C. Admin Login
**Endpoint:** `POST /api/auth/login`

1.  **Input:** `{ email, password }`
2.  **Security Checks:**
    *   Password matches hash.
    *   `isActive` is true.
    *   **`isVerified` is true** (Critical Check).
3.  **Result:** Return JWT Token.

### D. Password Management
1.  **Forgot Password:** Sends a time-limited reset link (already implemented).
2.  **Change Password:** Authenticated user can change password by providing *Current Password* (already implemented).

## 4. Immediate Implementation Tasks
1.  **Schema:** Update `prisma/schema.prisma` with new Admin fields.
2.  **Database:** Run `npx prisma db push`.
3.  **Backend:** Refactor `authController.register` to enforce single-admin limit and OTP generation.
4.  **Backend:** Update `authController.verifyOTP` to handle Admin tables.
5.  **Seeding:** Update `seed.js` to ensure the Dev Admin is pre-verified (for development convenience).
