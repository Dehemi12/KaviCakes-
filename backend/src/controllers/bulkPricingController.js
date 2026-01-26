const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getBulkPricing = async (req, res) => {
    try {
        const pricing = await prisma.bulkPricing.findMany();
        res.json(pricing);
    } catch (error) {
        console.error('Error fetching bulk pricing:', error);
        res.status(500).json({ error: 'Failed to fetch pricing' });
    }
};

module.exports = {
    getBulkPricing
};
