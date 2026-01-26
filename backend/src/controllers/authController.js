const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

// Configure Nodemailer (Using Gmail as example, or just logging if credentials missing)
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your SMTP host
    auth: {
        user: process.env.EMAIL_USER, // Add these to .env later
        pass: process.env.EMAIL_PASS
    }
});

// Helper to send email
const sendEmail = async (to, subject, text) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`[Mock Email] To: ${to}, Subject: ${subject}, Body: ${text}`);
        return;
    }
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    });
};

exports.register = async (req, res) => {
    try {
        const { email, password, name, phone, address, role } = req.body;

        if (role === 'CUSTOMER') {
            // Check if customer exists
            let customer = await prisma.customer.findUnique({ where: { email } });
            if (customer) return res.status(400).json({ error: 'Customer already exists' });

            // Generate Display ID (Simple counter approach or UUID based)
            // For simplicity in this phase, we'll count existing customers + 1
            const count = await prisma.customer.count();
            const displayId = `C${(count + 1).toString().padStart(3, '0')}`;

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            customer = await prisma.customer.create({
                data: {
                    displayId,
                    name,
                    email,
                    password: hashedPassword,
                    phone,
                    address
                }
            });

            return res.status(201).json({ message: 'Customer registered successfully' });
        } else {
            // Admin Registration
            // Check if user exists
            let user = await prisma.admin.findUnique({ where: { email } });
            if (user) return res.status(400).json({ error: 'User already exists' });

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create user
            user = await prisma.admin.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                },
            });

            return res.status(201).json({ message: 'Admin registered successfully' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (role === 'CUSTOMER') {
            const customer = await prisma.customer.findUnique({ where: { email } });
            if (!customer) return res.status(400).json({ error: 'Invalid credentials' });

            if (!customer.isActive) return res.status(403).json({ error: 'Account is inactive' });

            const isMatch = await bcrypt.compare(password, customer.password);
            if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

            const token = jwt.sign(
                { id: customer.id, role: 'CUSTOMER' },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            return res.json({
                token,
                user: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    role: 'CUSTOMER',
                    phone: customer.phone
                },
            });

        } else {
            // Check Admin
            const user = await prisma.admin.findUnique({ where: { email } });
            if (!user) return res.status(400).json({ error: 'Invalid credentials' });

            if (!user.isActive) return res.status(403).json({ error: 'Account is inactive' });

            // Check password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

            // Generate token
            const token = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            return res.json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
            return res.json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        // Check both tables
        let user = await prisma.admin.findUnique({ where: { email } });
        let role = 'ADMIN';

        if (!user) {
            user = await prisma.customer.findUnique({ where: { email } });
            role = 'CUSTOMER';
        }

        if (!user) {
            // Check security practice: return success even if email not found?
            // For now, let's be explicitly helpful for admin panel dev
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate simple token (In prod, use crypto random bytes)
        const resetToken = jwt.sign(
            { id: user.id, role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Verification Link
        // Assuming Frontend runs on localhost:3000 (usually). If admin-web is distinct from customer-web, this link might need config.
        // admin-web handles reset for both? Or separates?
        // ResetPassword.jsx exists in admin-web, so let's point there.
        const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

        const subject = 'Password Reset Request';
        const text = `You requested a password reset. Click the link to reset: ${resetLink}`;

        await sendEmail(email, subject, text);

        res.json({ message: 'Reset link sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        if (decoded.role === 'CUSTOMER') {
            await prisma.customer.update({
                where: { id: decoded.id },
                data: { password: hashedPassword }
            });
        } else {
            await prisma.admin.update({
                where: { id: decoded.id },
                data: { password: hashedPassword }
            });
        }

        res.json({ message: 'Password reset successfully' });

    } catch (error) {
        // Token invalid or expired
        return res.status(400).json({ error: 'Invalid or expired token' });
    }
};
