const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// POST /api/upload          → cakes folder (default for product images)
// POST /api/upload/site     → site folder (hero banner, category images)
// POST /api/upload/slip     → slips folder (bank payment slips)

router.post('/', upload.single('file'), handleUpload('cakes'));
router.post('/site', upload.single('file'), handleUpload('site'));
router.post('/slip', upload.single('file'), handleUpload('slips'));

function handleUpload(folder) {
    return (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
            const fileUrl = `${BASE_URL}/uploads/${folder}/${req.file.filename}`;
            res.json({
                message: 'File uploaded successfully',
                url: fileUrl,
                filename: req.file.filename,
                folder
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
}

module.exports = router;
