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
    const { email, role } = req.body;
    console.log(`[Registration] >>> Start request for: ${email} (${role})`);

    try {
        const { password, name, phone, address } = req.body;

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        if (role === 'CUSTOMER') {
            console.log(`[Registration] Checking if customer exists...`);
            let customer = await prisma.customer.findUnique({ where: { email } });
            if (customer) {
                console.warn(`[Registration] Customer already exists: ${email}`);
                return res.status(400).json({ error: 'Customer already exists' });
            }

            console.log(`[Registration] Calculating display ID and hashing password...`);
            const count = await prisma.customer.count();
            const displayId = `C${(count + 1).toString().padStart(3, '0')}`;

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

            console.log(`[Registration] Saving customer to database...`);
            customer = await prisma.customer.create({
                data: {
                    displayId,
                    name,
                    email,
                    password: hashedPassword,
                    phone,
                    address,
                    isVerified: false,
                    otp,
                    otpExpiresAt
                }
            });
            console.log(`[Registration] Successfully created customer ID: ${customer.id}`);

            console.log(`[Registration] Attempting to send OTP email via: ${process.env.EMAIL_USER}`);
            try {
                await sendEmail(email, 'KaviCakes - Email Verification', `Your verification code is: ${otp}`);
                console.log(`[Registration] OTP Email sent successfully to: ${email}`);
            } catch (emailError) {
                console.error(`[Registration] ERROR: Failed to send email to ${email}:`, emailError.message);
                // We proceed since user is created, but logging the error is critical
            }

            return res.status(201).json({ message: 'Registration successful. OTP sent to email.' });
        } else {
            console.log(`[Registration] Checking Admin count...`);
            const adminCount = await prisma.admin.count();
            if (adminCount > 0) {
                console.warn(`[Registration] Admin setup blocked: Admin already exists.`);
                return res.status(403).json({ error: 'Admin setup already completed. Only one admin allowed.' });
            }

            // Double check email specific (though count blocks it first)
            let user = await prisma.admin.findUnique({ where: { email } });
            if (user) {
                return res.status(400).json({ error: 'User already exists' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

            console.log(`[Registration] Creating admin user...`);
            user = await prisma.admin.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    isVerified: false,
                    otp,
                    otpExpiresAt
                },
            });
            console.log(`[Registration] Admin created successfully: ${email}`);

            // Send OTP
            try {
                await sendEmail(email, 'KaviCakes - Admin Verification', `Your verification code is: ${otp}`);
                console.log(`[Registration] OTP Email sent successfully to: ${email}`);
            } catch (emailError) {
                console.error(`[Registration] ERROR: Failed to send email to ${email}:`, emailError.message);
            }

            return res.status(201).json({ message: 'Admin registration successful. OTP sent to email.' });
        }
    } catch (error) {
        console.error(`[Registration] CRITICAL ERROR for ${email}:`, error);
        res.status(500).json({ error: 'Server error during registration' });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Check verification for both roles
        let userCategory = 'CUSTOMER';
        let user = await prisma.customer.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.admin.findUnique({ where: { email } });
            userCategory = 'ADMIN';
        }

        if (!user) return res.status(400).json({ error: 'User not found' });
        if (user.isVerified) return res.status(400).json({ error: 'User already verified' });

        if (!user.otp || user.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        if (new Date() > user.otpExpiresAt) {
            return res.status(400).json({ error: 'OTP expired' });
        }

        // Verify user
        if (userCategory === 'CUSTOMER') {
            await prisma.customer.update({
                where: { id: user.id },
                data: { isVerified: true, otp: null, otpExpiresAt: null }
            });
        } else {
            await prisma.admin.update({
                where: { id: user.id },
                data: { isVerified: true, otp: null, otpExpiresAt: null }
            });
        }

        res.json({ message: 'Email verified successfully. You can now login.' });

    } catch (error) {
        console.error('[AuthController:verifyOTP] Error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        let userCategory = 'CUSTOMER';
        let user = await prisma.customer.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.admin.findUnique({ where: { email } });
            userCategory = 'ADMIN';
        }

        if (!user) return res.status(400).json({ error: 'User not found' });
        if (user.isVerified) return res.status(400).json({ error: 'User already verified' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        if (userCategory === 'CUSTOMER') {
            await prisma.customer.update({ where: { id: user.id }, data: { otp, otpExpiresAt } });
        } else {
            await prisma.admin.update({ where: { id: user.id }, data: { otp, otpExpiresAt } });
        }

        await sendEmail(email, 'KaviCakes - New OTP', `Your new verification code is: ${otp}`);

        res.json({ message: 'New OTP sent.' });
    } catch (error) {
        console.error('[AuthController:resendOTP] Error:', error);
        res.status(500).json({ error: 'Failed' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (role === 'CUSTOMER') {
            const customer = await prisma.customer.findUnique({ where: { email } });
            if (!customer) return res.status(400).json({ error: 'Invalid credentials' });

            if (!customer.isActive) return res.status(403).json({ error: 'Account is inactive' });

            // Verification Check
            if (!customer.isVerified) {
                return res.status(403).json({ error: 'Please verify your email first.', needsVerification: true });
            }

            const isMatch = await bcrypt.compare(password, customer.password);
            if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

            const token = jwt.sign(
                { id: customer.id, role: 'CUSTOMER' },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            return res.json({
                token,
                user: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    role: 'CUSTOMER',
                    phone: customer.phone,
                    loyaltyPoints: customer.loyaltyPoints // Include Points
                },
            });

        } else {
            // Check Admin
            const user = await prisma.admin.findUnique({ where: { email } });
            if (!user) return res.status(400).json({ error: 'Invalid credentials' });

            if (!user.isActive) return res.status(403).json({ error: 'Account is inactive' });

            // Verification Check for Admin
            if (!user.isVerified) {
                return res.status(403).json({ error: 'Please verify your email first.', needsVerification: true });
            }

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
        }
    } catch (error) {
        console.error('[AuthController:login] Error:', error);
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
        // Dynamic link based on role
        let baseUrl = 'http://localhost:3000'; // Default to admin
        if (role === 'CUSTOMER') {
            baseUrl = 'http://localhost:5173'; // Default to customer web (Vite)
        }

        const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

        const subject = 'Password Reset Request';
        const text = `You requested a password reset. Click the link to reset: ${resetLink}`;

        await sendEmail(email, subject, text);

        res.json({ message: 'Reset link sent' });
    } catch (error) {
        console.error('[AuthController:forgotPassword] Error:', error);
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
        console.error('[AuthController:resetPassword] Error:', error);
        return res.status(400).json({ error: 'Invalid or expired token' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { id, role } = req.user;
        const { name } = req.body;

        if (role === 'CUSTOMER') {
            await prisma.customer.update({
                where: { id },
                data: { name }
            });
        } else {
            await prisma.admin.update({
                where: { id },
                data: { name }
            });
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('[AuthController:updateProfile] Error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { id, role } = req.user;
        const { currentPassword, newPassword } = req.body;

        let user;
        if (role === 'CUSTOMER') {
            user = await prisma.customer.findUnique({ where: { id } });
        } else {
            user = await prisma.admin.findUnique({ where: { id } });
        }

        if (!user) return res.status(404).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Incorrect current password' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        if (role === 'CUSTOMER') {
            await prisma.customer.update({
                where: { id },
                data: { password: hashedPassword }
            });
        } else {
            await prisma.admin.update({
                where: { id },
                data: { password: hashedPassword }
            });
        }

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('[AuthController:changePassword] Error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const { id, role } = req.user;
        let user;
        if (role === 'CUSTOMER') {
            user = await prisma.customer.findUnique({
                where: { id },
                select: { id: true, name: true, email: true, phone: true, address: true, loyaltyPoints: true, displayId: true }
            });
        } else {
            user = await prisma.admin.findUnique({
                where: { id },
                select: { id: true, name: true, email: true, role: true }
            });
        }
        res.json(user);
    } catch (error) {
        console.error('[AuthController:getProfile] Error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};
