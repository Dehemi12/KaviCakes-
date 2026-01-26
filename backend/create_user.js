const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2];
    const password = process.argv[3];
    const name = process.argv[4] || 'New Admin';

    if (!email || !password) {
        console.log('Usage: node create_user.js <email> <password> [name]');
        return;
    }

    console.log(`Creating admin user: ${email}...`);

    try {
        // Check if exists
        const existing = await prisma.admin.findUnique({ where: { email } });
        if (existing) {
            console.log(`User with email ${email} already exists.`);
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.admin.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'ADMIN',
                isActive: true
            }
        });
        console.log(`✅ Admin created successfully: ${user.email}`);
    } catch (e) {
        console.error('❌ Error creating admin:', e);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
