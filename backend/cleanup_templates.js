const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Email Template Deduplication & Cleanup ---');
    
    const templates = await prisma.notificationtemplate.findMany();
    const grouped = {};
    
    // Group by type
    templates.forEach(t => {
        if (!grouped[t.type]) grouped[t.type] = [];
        grouped[t.type].push(t);
    });
    
    for (const type in grouped) {
        const list = grouped[type];
        if (list.length > 1) {
            console.log(`\nFound ${list.length} templates for type: ${type}`);
            
            // Heuristic: Keep the one that contains 'styled' HTML (<div>) or the longest one.
            // Also prefer ones that have a name that equals the type.
            list.sort((a, b) => {
                const aIsStyled = a.body.includes('<div') ? 1 : 0;
                const bIsStyled = b.body.includes('<div') ? 1 : 0;
                if (aIsStyled !== bIsStyled) return bIsStyled - aIsStyled;
                return b.body.length - a.body.length;
            });
            
            const toKeep = list[0];
            const toDelete = list.slice(1);
            
            console.log(`KEEPING: ID ${toKeep.id} (Name: ${toKeep.name}, Length: ${toKeep.body.length})`);
            
            for (const d of toDelete) {
                console.log(`DELETING: ID ${d.id} (Name: ${d.name}, Length: ${d.body.length})`);
                await prisma.notificationtemplate.delete({ where: { id: d.id } });
            }
        }
    }
    
    console.log('\n--- Cleanup Complete ---');
}

main().finally(() => prisma.$disconnect());
