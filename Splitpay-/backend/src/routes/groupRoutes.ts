import { Router } from 'express';
import * as groupController from '../controllers/groupController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken); // Protect all group routes

router.post('/', groupController.create);
router.get('/', groupController.getMyGroups);
router.post('/add-member', groupController.addMember);

export default router;
