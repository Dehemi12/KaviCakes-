const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing pricing bug for Cartoon Theme Mini Cake (2kg)...');
  
  // Find the variant
  const variant = await prisma.cakeVariant.findUnique({
    where: { id: 38 },
    include: {
        cake: { select: { name: true } },
        size: { select: { label: true } }
    }
  });

  if (variant) {
    console.log(`Found variant: ${variant.cake?.name} - ${variant.size?.label}`);
    console.log(`Current Price: Rs. ${variant.price}`);
    
    // Update price to Rs. 4000 (typical 2kg price)
    const updated = await prisma.cakeVariant.update({
      where: { id: 38 },
      data: { price: 4000 }
    });
    
    console.log(`Updated Price to: Rs. ${updated.price}`);
  } else {
    console.log('Variant ID 38 not found. Searching by name...');
    
    // Fallback search if ID 38 isn't it
    const cakes = await prisma.cake.findMany({
        where: { name: { contains: 'Cartoon' } },
        include: { variants: { include: { size: true } } }
    });
    
    if (cakes.length === 0) {
        console.log('No Cartoon cakes found.');
    }

    cakes.forEach(cake => {
        console.log(`Found Cake: ${cake.name} (ID: ${cake.id})`);
        cake.variants.forEach(async (v) => {
            console.log(`- Variant: ${v.size?.label} size, Price: ${v.price} (ID: ${v.id})`);
            if (v.size?.label === '2kg' && v.price === 20000) {
                 console.log('Matching bug found! Updating...');
                 await prisma.cakeVariant.update({
                    where: { id: v.id },
                    data: { price: 4000 }
                 });
                 console.log(`Updated ID ${v.id} successfully.`);
            }
        });
    });
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
