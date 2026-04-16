const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get Site Settings (Public/Admin)
exports.getSiteSettings = async (req, res) => {
    try {
        const settings = await prisma.sitesetting.findMany();
        const config = {};
        // Convert array to object { key: value }
        settings.forEach(s => config[s.key] = s.value);
        res.json(config);
    } catch (error) {
        console.error('[ContentController] Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch site settings' });
    }
};

// Update Site Settings (Admin)
exports.updateSiteSettings = async (req, res) => {
    try {
        // Expecting body: { 'HOME_HERO_TITLE': '...', 'HOME_HERO_IMAGE': '...' }
        const updates = req.body;

        const updatePromises = Object.keys(updates).map(key =>
            prisma.sitesetting.upsert({
                where: { key },
                update: { 
                    value: updates[key],
                    updatedAt: new Date()
                },
                create: { 
                    key, 
                    value: updates[key], 
                    group: 'HOME_PAGE',
                    updatedAt: new Date()
                }
            })
        );

        await Promise.all(updatePromises);

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('[ContentController] Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update site settings' });
    }
};
