const app = require('./src/app');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const port = process.env.PORT || 5000;
const prisma = new PrismaClient();

async function main() {
  try {
    // Test database connection
    // await prisma.$connect();
    // console.log('✅ Database connected successfully');

    app.listen(port, () => {
      console.log(`🚀 Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('❌ database connection failed:', error);
    process.exit(1);
  }
}

main();
