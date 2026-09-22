import { Router } from 'express';
import companiesRouter from './companies.routes.js';
import applicationsRouter, {
  submissionsRouterTop, assessmentsRouterTop, communicationsRouterTop,
} from './applications.routes.js';
import dashboardRouter from './dashboard.routes.js';
import {
  companyBranchesRouter, companyContactsRouter, branchesRouter, contactsRouter,
} from './branchesContacts.routes.js';
import * as communicationsController from '../controllers/communications.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pool } from '../config/db.js';

const router = Router();

router.get('/health', asyncHandler(async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ db: 'ok', time: new Date().toISOString() });
}));

router.use('/companies', companiesRouter);
router.use('/companies/:id/branches', companyBranchesRouter);
router.use('/companies/:id/contacts', companyContactsRouter);
router.use('/branches', branchesRouter);
router.use('/contacts', contactsRouter);
router.use('/applications', applicationsRouter);
router.use('/submissions', submissionsRouterTop);
router.use('/assessments', assessmentsRouterTop);
router.use('/communications', communicationsRouterTop);
router.use('/dashboard', dashboardRouter);

// Alias per API plan
router.get('/follow-ups/due', asyncHandler(communicationsController.dueFollowUps));

export default router;
