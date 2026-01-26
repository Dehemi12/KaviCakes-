# Implement Forgot Password Authentication

## Status
- [x] Backend: Update Email Link Logic
- [x] Frontend: Create ForgotPassword Page
- [x] Frontend: Create ResetPassword Page
- [x] Frontend: Update Routes

## Context
User wants to implement "Forgot Password" functionality.
Backend already has logic but routes to `localhost:3000` (Admin) hardcoded.
Admin Web has pages.
Customer Web is missing pages.

## Plan
1.  **Backend**: Modify `authController.js` to send `localhost:5173` link for customers and `3000` for admins.
2.  **Frontend (Customer)**:
    -   Create `src/pages/auth/ForgotPassword.jsx`: Input email -> Call API.
    -   Create `src/pages/auth/ResetPassword.jsx`: Input new password -> Call API (using token from URL).
    -   Update `App.jsx`: Add routes `/forgot-password` and `/reset-password`.
