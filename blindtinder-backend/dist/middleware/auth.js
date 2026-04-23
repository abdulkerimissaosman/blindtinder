import { verifyToken } from '../utils/jwt.js';
export function authRequired(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing bearer token' });
    }
    const token = header.slice('Bearer '.length).trim();
    try {
        req.userId = verifyToken(token);
        return next();
    }
    catch {
        return res.status(401).json({ message: 'Invalid token' });
    }
}
