import { Router } from 'express';
import * as expenseController from '../controllers/expenseController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/', expenseController.create);
router.get('/', expenseController.getExpenses);

export default router;
