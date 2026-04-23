import jwt from 'jsonwebtoken';
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    return secret;
}
export function signToken(userId) {
    return jwt.sign({ sub: userId }, getJwtSecret(), { expiresIn: '7d' });
}
export function verifyToken(token) {
    const payload = jwt.verify(token, getJwtSecret());
    if (typeof payload === 'string' || !payload.sub) {
        throw new Error('Invalid token');
    }
    return String(payload.sub);
}
