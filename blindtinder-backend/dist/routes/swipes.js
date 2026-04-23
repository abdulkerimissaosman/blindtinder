import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { createSwipe, getMatchById } from '../repository.js';
import { emitMatchCreated } from '../socket.js';
const router = Router();
router.post('/', authRequired, async (req, res, next) => {
    try {
        const authReq = req;
        const { toUserId, action } = req.body ?? {};
        if (!authReq.userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!toUserId || !action) {
            return res.status(400).json({ message: 'toUserId and action are required' });
        }
        const result = await createSwipe(authReq.userId, toUserId, action);
        if (result.newMatchId) {
            const match = await getMatchById(result.newMatchId);
            if (match) {
                emitMatchCreated(match);
            }
        }
        return res.json(result);
    }
    catch (error) {
        return next(error);
    }
});
export { router as swipesRouter };
