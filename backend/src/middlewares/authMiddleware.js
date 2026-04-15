const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        console.warn('[AuthMiddleware] No token provided');
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        console.log(`[AuthMiddleware] Verifying token: ${token.substring(0, 10)}...`);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('[AuthMiddleware] JWT Verification Failed:', error.message);
        res.status(401).json({ error: `Invalid token: ${error.message}` });
    }
};
