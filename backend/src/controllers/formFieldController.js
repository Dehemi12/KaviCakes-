const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all fields for a form type (CUSTOM or BULK)
exports.getFields = async (req, res) => {
    try {
        const { formType } = req.params;
        const fields = await prisma.formfield.findMany({
            where: { formType: formType.toUpperCase() },
            orderBy: { displayOrder: 'asc' }
        });
        res.json(fields.map(f => ({
            ...f,
            options: f.options ? JSON.parse(f.options) : [],
            config: f.config ? JSON.parse(f.config) : {}
        })));
    } catch (error) {
        console.error('[FormFieldController:getFields]', error);
        res.status(500).json({ error: 'Failed to fetch form fields' });
    }
};

// POST create a new field
exports.createField = async (req, res) => {
    try {
        const { formType, fieldId, label, fieldType, required, active, displayOrder, section, options, config } = req.body;

        // Validate fieldId uniqueness per formType
        const existing = await prisma.formfield.findFirst({
            where: { formType: formType.toUpperCase(), fieldId }
        });
        if (existing) {
            return res.status(400).json({ error: `Field ID "${fieldId}" already exists for this form type.` });
        }

        const field = await prisma.formfield.create({
            data: {
                formType: formType.toUpperCase(),
                fieldId,
                label,
                fieldType,
                required: !!required,
                active: active !== false,
                displayOrder: displayOrder || 99,
                section: section || 'basic_details',
                options: options ? JSON.stringify(options) : '[]',
                config: config ? JSON.stringify(config) : '{}',
                updatedAt: new Date()
            }
        });
        res.status(201).json({
            ...field,
            options: JSON.parse(field.options || '[]'),
            config: JSON.parse(field.config || '{}')
        });
    } catch (error) {
        console.error('[FormFieldController:createField]', error);
        res.status(500).json({ error: 'Failed to create form field' });
    }
};

// PUT update a field
exports.updateField = async (req, res) => {
    try {
        const { id } = req.params;
        const { label, fieldType, required, active, displayOrder, section, options, config } = req.body;

        const field = await prisma.formfield.update({
            where: { id: parseInt(id) },
            data: {
                label,
                fieldType,
                required: !!required,
                active: !!active,
                displayOrder: displayOrder ?? 99,
                section: section || 'basic_details',
                options: options ? JSON.stringify(options) : '[]',
                config: config ? JSON.stringify(config) : '{}',
                updatedAt: new Date()
            }
        });
        res.json({
            ...field,
            options: JSON.parse(field.options || '[]'),
            config: JSON.parse(field.config || '{}')
        });
    } catch (error) {
        console.error('[FormFieldController:updateField]', error);
        res.status(500).json({ error: 'Failed to update form field' });
    }
};

// DELETE a field
exports.deleteField = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.formfield.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Field deleted successfully' });
    } catch (error) {
        console.error('[FormFieldController:deleteField]', error);
        res.status(500).json({ error: 'Failed to delete form field' });
    }
};

// PUT reorder fields (bulk update displayOrder)
exports.reorderFields = async (req, res) => {
    try {
        const { orderedIds } = req.body; // array of ids in new order
        const updates = orderedIds.map((id, index) =>
            prisma.formfield.update({
                where: { id: parseInt(id) },
                data: { displayOrder: index + 1 }
            })
        );
        await prisma.$transaction(updates);
        res.json({ message: 'Fields reordered' });
    } catch (error) {
        console.error('[FormFieldController:reorderFields]', error);
        res.status(500).json({ error: 'Failed to reorder fields' });
    }
};

// GET public fields (for customer-facing forms, no auth needed)
exports.getPublicFields = async (req, res) => {
    try {
        const { formType } = req.params;
        const fields = await prisma.formfield.findMany({
            where: {
                formType: formType.toUpperCase(),
                active: true
            },
            orderBy: { displayOrder: 'asc' }
        });
        res.json(fields.map(f => ({
            ...f,
            options: f.options ? JSON.parse(f.options) : [],
            config: f.config ? JSON.parse(f.config) : {}
        })));
    } catch (error) {
        console.error('[FormFieldController:getPublicFields]', error);
        res.status(500).json({ error: 'Failed to fetch form fields' });
    }
};
