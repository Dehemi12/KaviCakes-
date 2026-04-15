const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    // delete ONLY custom and bulk fields (maybe not standard if they are different)
    await prisma.formField.deleteMany({
        where: {
            formType: { in: ['CUSTOM', 'BULK'] }
        }
    });
    
    const fields = [
        { formType: 'CUSTOM', fieldId: 'flavor', label: 'Cake Flavor', fieldType: 'dropdown', required: true, options: [{ name: 'Chocolate', price: 0 }, { name: 'Vanilla', price: 0 }, { name: 'Red Velvet', price: 500 }], section: 'design_details' },
        { formType: 'CUSTOM', fieldId: 'message', label: 'Cake Message', fieldType: 'text', required: false, config: { placeholder: 'Happy Birthday...', maxLength: 50 }, section: 'design_details' },
        { formType: 'CUSTOM', fieldId: 'reference_image', label: 'Reference Image', fieldType: 'file', required: false, config: { accept: 'image/*', maxSizeMB: 5 }, section: 'design_details' },
        
        { formType: 'BULK', fieldId: 'event_name', label: 'Event Name', fieldType: 'text', required: true, config: { placeholder: 'e.g. Annual Gathering' }, section: 'basic_details', displayOrder: 1 },
        { formType: 'BULK', fieldId: 'organization', label: 'Organization/Company Name', fieldType: 'text', required: true, section: 'basic_details', displayOrder: 2 },
        { formType: 'BULK', fieldId: 'qty_estimate', label: 'Quantity', fieldType: 'number', required: true, config: { min: 50 }, section: 'basic_details', displayOrder: 3 },
        { formType: 'BULK', fieldId: 'product_unit', label: 'Select Product Unit', fieldType: 'dropdown', required: true, options: [
            { name: 'Cupcakes', price: 250, imageUrl: 'https://images.unsplash.com/photo-1599785209707-33b6a22f7907?auto=format&fit=crop&q=80&w=300' },
            { name: 'Jar Cakes', price: 350, imageUrl: 'https://images.unsplash.com/photo-1563729768601-d6fa4805e9a1?auto=format&fit=crop&q=80&w=300' },
            { name: 'Brownies', price: 200, imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=300' },
            { name: 'Mini Wedding Cakes', price: 800, imageUrl: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&q=80&w=300' }
        ], section: 'bulk_specific', displayOrder: 4 },
        { formType: 'BULK', fieldId: 'reference_image', label: 'Custom Reference Image (Optional)', fieldType: 'file', required: false, config: { accept: 'image/*' }, section: 'design_details', displayOrder: 5 },
        { formType: 'BULK', fieldId: 'packaging_type', label: 'Packaging Design', fieldType: 'dropdown', required: true, options: [
            { name: 'Standard Box', price: 0, imageUrl: 'https://placehold.co/300x200/f8fafc/64748b?text=Standard+Box' },
            { name: 'Premium Ribbon Box', price: 50, imageUrl: 'https://placehold.co/300x200/fce7f3/be185d?text=Premium+Ribbon' },
            { name: 'Custom Printed Box', price: 150, imageUrl: 'https://placehold.co/300x200/e0e7ff/4338ca?text=Custom+Print' }
        ], section: 'bulk_specific', displayOrder: 6 },
        { formType: 'BULK', fieldId: 'packaging_design_file', label: 'Upload Package Design Details (Optional)', fieldType: 'file', required: false, config: { accept: 'image/*' }, section: 'bulk_specific', displayOrder: 7 },
        { formType: 'BULK', fieldId: 'special_instructions', label: 'Special Instructions', fieldType: 'textarea', required: false, config: { placeholder: 'Any specific allergy requirements or themes?' }, section: 'basic_details', displayOrder: 8 }
    ];

    for (let f of fields) {
        if(f.options) f.options = JSON.stringify(f.options);
        if(f.config) f.config = JSON.stringify(f.config);
        await prisma.formField.create({ data: f });
    }
    console.log('Seeded successfully!');
    process.exit(0);
}
seed().catch(e => {
    console.error(e);
    process.exit(1);
});
