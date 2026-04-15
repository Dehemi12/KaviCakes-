const multer = require('multer');
const path = require('path');
const fs = require('fs');

const BASE_UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Create sub-folders on startup
const FOLDERS = ['cakes', 'slips', 'site'];
FOLDERS.forEach(folder => {
    const dir = path.join(BASE_UPLOAD_DIR, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Determine sub-folder from request route context
function resolveFolder(req) {
    const url = req.originalUrl || '';
    if (url.includes('/upload-slip') || url.includes('/upload/slip')) return 'slips';
    if (url.includes('/upload/site') || url.includes('/content')) return 'site';
    return 'cakes'; // default: cake images
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const folder = resolveFolder(req);
        cb(null, path.join(BASE_UPLOAD_DIR, folder));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMime = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    const allowedExt = /\.(jpeg|jpg|png|webp|pdf)$/i;
    const extOk = allowedExt.test(path.extname(file.originalname));
    if (allowedMime.includes(file.mimetype) && extOk) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, WebP, and PDF allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = upload;
