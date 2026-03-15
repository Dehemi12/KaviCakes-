
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function testFlow() {
    try {
        console.log("1. Setting known password for 'woofydehemi@gmail.com'...");
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('123456', salt);

        const user = await prisma.customer.update({
            where: { email: 'woofydehemi@gmail.com' },
            data: { password: password }
        });
        console.log("   Password updated to '123456'.");

        console.log("2. Attempting Login...");
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'woofydehemi@gmail.com',
                password: '123456',
                role: 'CUSTOMER'
            })
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(JSON.stringify(loginData));

        const token = loginData.token;
        console.log("   Login Successful. Token obtained.");

        console.log("3. Fetching My Orders...");
        const ordersRes = await fetch(`${API_URL}/orders/my-orders`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const ordersData = await ordersRes.json();
        console.log(`   Response Status: ${ordersRes.status}`);

        if (!ordersRes.ok) {
            console.log("   Body:", ordersData);
        } else {
            console.log(`   Orders Found: ${ordersData.length}`);
            if (ordersData.length > 0) {
                console.log("   First Order ID: ", ordersData[0].id);
                console.log("   First Order Status: ", ordersData[0].status);
            }
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

testFlow();
