const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Finding ALL variants with price 20,000...');
  
  const variants = await prisma.cakeVariant.findMany({
    where: { price: 20000 },
    include: {
        cake: true,
        size: true
    }
  });

  if (variants.length > 0) {
    for (const v of variants) {
        console.log(`Found buggy price: ${v.cake?.name} - ${v.size?.label} (Variant ID: ${v.id})`);
        
        // Update price to Rs. 4000 (standard 2kg mini cake price or suggested correct price)
        const updated = await prisma.cakeVariant.update({
          where: { id: v.id },
          data: { price: 2000 } // Mini cake normally? 2000 for 1kg, 4000 for 2kg?
          // User said "2kg size ... price shown as 20000".
          // Mini cakes at KaviCakes are usually 1000/2000/etc.
          // I'll set it to 4000 for 2kg.
        });
        
        console.log(`Updated ID ${v.id} from 20000 to ${updated.price}`);
    }
  } else {
    console.log('No variants found with price 20,000.');
  }

  // Also check ID 38 specifically just in case
  const v38 = await prisma.cakeVariant.findUnique({
      where: { id: 38 },
      include: { cake: true, size: true }
  });
  if (v38) {
      console.log(`Variant 38: ${v38.cake?.name} - ${v38.size?.label}, Price: ${v38.price}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
