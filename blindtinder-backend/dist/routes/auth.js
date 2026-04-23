import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { createUser, emailExists, getUserProfile, getUserProfileByEmail, verifyPassword } from '../repository.js';
import { signToken } from '../utils/jwt.js';
const router = Router();
router.post('/register', async (req, res, next) => {
    try {
        const { email, password, fullName, age, city, bio, avatarUrl, disabilities, accessibilityNeeds, minPreferredAge, maxPreferredAge, preferredCity, sameCityOnly, } = req.body ?? {};
        if (!email || !password || !fullName) {
            return res.status(400).json({ message: 'email, password, and fullName are required' });
        }
        if (await emailExists(email)) {
            return res.status(409).json({ message: 'Email is already registered' });
        }
        const user = await createUser({
            email,
            password,
            fullName,
            age,
            city,
            bio,
            avatarUrl,
            disabilities,
            accessibilityNeeds,
            minPreferredAge,
            maxPreferredAge,
            preferredCity,
            sameCityOnly,
        });
        if (!user) {
            return res.status(500).json({ message: 'Could not create user' });
        }
        const created = await getUserProfileByEmail(email);
        if (!created) {
            return res.status(500).json({ message: 'Could not load created user' });
        }
        return res.status(201).json({
            token: signToken(created.id),
            user: created,
        });
    }
    catch (error) {
        return next(error);
    }
});
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body ?? {};
        if (!email || !password) {
            return res.status(400).json({ message: 'email and password are required' });
        }
        const user = await getUserProfileByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const allowed = await verifyPassword(user.id, password);
        if (!allowed) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        return res.json({
            token: signToken(user.id),
            user,
        });
    }
    catch (error) {
        return next(error);
    }
});
router.get('/me', authRequired, async (req, res, next) => {
    try {
        const authReq = req;
        if (!authReq.userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const user = await getUserProfile(authReq.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.json(user);
    }
    catch (error) {
        return next(error);
    }
});
export { router as authRouter };
