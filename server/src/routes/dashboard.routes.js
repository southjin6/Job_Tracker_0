import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import * as communicationsController from '../controllers/communications.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/stats', asyncHandler(dashboardController.stats));
router.get('/pipeline', asyncHandler(dashboardController.pipeline));
router.get('/follow-ups-due', asyncHandler(communicationsController.dueFollowUps));

export default router;
