const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Updating Cake Size Prices...');

    const updates = [
        { label: '1kg', price: 1000 },
        { label: '2kg', price: 2000 },
        { label: '3kg', price: 3000 },
        { label: '1.5kg', price: 1500 }, // Adding half sizes just in case, consistent logic
        { label: '500g', price: 500 }
    ];

    for (const update of updates) {
        const size = await prisma.cakeSize.upsert({
            where: { label: update.label },
            update: { price: update.price },
            create: { label: update.label, price: update.price },
        });
        console.log(`Updated ${update.label}: Rs.${size.price}`);
    }

    // Also update specific verbose labels if they are used in frontend hardcoding
    // In CustomOrderPage.jsx, it uses '1 kg (Serves 10-12)'. 
    // Wait, line 182 maps masterData.sizes. So if I update '1kg', the dropdown will show '1kg'.
    // But CustomOrderPage.jsx initializes: cakeSize: '1 kg (Serves 10-12)'
    // Does '1 kg (Serves 10-12)' exist in DB? The fetch command showed '1kg'.
    // The frontend uses `masterData.sizes.find(s => s.label === formData.cakeSize)`.
    // If formData default is '1 kg (Serves 10-12)' but DB has '1kg', the default selection might fail validation/finding.
    // I should check `CustomOrderPage.jsx` logic again.
    // Line 183: `<option key={s.id} value={s.label}>{s.label} (+Rs.{s.price})</option>`
    // So the value comes from DB label.
    // The default state (Line 15) is hardcoded: `cakeSize: '1 kg (Serves 10-12)',`.
    // This default state seems wrong if DB has '1kg'.
    // I should probably fix the frontend default state to match what's in the DB or fetching the first one dynamically.
    // In `CustomOrderPage.jsx` line 48:
    // if (res.data.categories?.length) { setFormData... } 
    // It doesn't set a default size from the fetched data, only category.
    // I should fix that in the frontend too.

    console.log('Done.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
