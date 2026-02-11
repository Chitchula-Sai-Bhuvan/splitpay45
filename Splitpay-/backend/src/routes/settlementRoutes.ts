import { Router } from 'express';
import * as settlementController from '../controllers/settlementController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/simplify', settlementController.getSuggestions);
router.get('/graph', settlementController.getGraph);
router.post('/', settlementController.settle);

export default router;
