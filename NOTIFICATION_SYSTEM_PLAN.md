# Notification System Implementation Plan

## 1. Database Schema Update (Prisma)
Add two new models to `prisma/schema.prisma`:
- `NotificationTemplate`: id, templateName, subject, body, type, createdAt
- `EmailLog`: id, orderId, email, status, sentAt, errorDetails (optional)
Run `npx prisma db push` or `migrate dev` to apply.

## 2. Backend Installation & Service
- Install `nodemailer`: `npm install nodemailer`.
- Create `emailService.js` in `src/utils/` to handle:
  - Transport configuration using Gmail SMTP & App Passwords.
  - Template variable parsing (with fallbacks: `{customer_name}` -> `Customer`, `{delivery_date}` -> `your scheduled date`).
  - Send individual emails.
  - Send bulk emails with throttling (2-3 seconds delay per email).

## 3. Real-Time Triggers
Update `orderController.js` to trigger emails:
- `updateStatus`: when status becomes `CONFIRMED` -> trigger `Order Confirmed` email.
- `updateStatus`: when status becomes `DELIVERED` -> trigger `Cake Delivered` email.
- `approvePayment`: when payment is approved -> trigger `Payment Confirmed` email.

## 4. Notification API Routes
Create `notificationController.js` and `notificationRoutes.js`:
- `GET /templates` & `POST /templates` & `PUT /templates/:id`
- `GET /logs`
- `GET /bulk/pending`: Execute logic to find pending payment reminders, last edit reminders, and ready notifications.
- `POST /bulk/send`: Trigger the throttled email queue for bulk sending.

## 5. Frontend UI Development
Create `AdminNotificationPanel.jsx` in `admin-web/src/pages/`:
- **Template Manager**: Table to edit/create templates.
- **Individual Actions Log**: View `EmailLog` history.
- **Bulk Notifications**: 
  - Switch between filters: "Payment Due", "Last Edit Chance", "Cake Ready".
  - Preview orders.
  - Preview template rendering.
  - "Send All" button that triggers the backend bulk route.
- Register route in `admin-web/src/App.jsx`.

## 6. Default Data Seeding
Create a seed script or add logic to auto-create the 6 default templates on system startup if they don't exist.
