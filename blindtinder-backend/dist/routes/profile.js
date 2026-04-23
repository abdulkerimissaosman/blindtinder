import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { getPreferences, getUserProfile, updatePreferences, updateUserProfile } from '../repository.js';
const router = Router();
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
router.put('/me', authRequired, async (req, res, next) => {
    try {
        const authReq = req;
        if (!authReq.userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const updated = await updateUserProfile(authReq.userId, req.body ?? {});
        if (!updated) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.json(updated);
    }
    catch (error) {
        return next(error);
    }
});
router.get('/preferences/me', authRequired, async (req, res, next) => {
    try {
        const authReq = req;
        if (!authReq.userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const preferences = await getPreferences(authReq.userId);
        return res.json(preferences);
    }
    catch (error) {
        return next(error);
    }
});
router.put('/preferences/me', authRequired, async (req, res, next) => {
    try {
        const authReq = req;
        if (!authReq.userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { minPreferredAge, maxPreferredAge, preferredCity, sameCityOnly } = req.body ?? {};
        const preferences = await updatePreferences(authReq.userId, {
            minPreferredAge,
            maxPreferredAge,
            preferredCity,
            sameCityOnly,
        });
        return res.json(preferences);
    }
    catch (error) {
        return next(error);
    }
});
export { router as profileRouter };
