import { Router } from 'express';
import * as applicationsController from '../controllers/applications.controller.js';
import * as submissionsController from '../controllers/submissions.controller.js';
import * as assessmentsController from '../controllers/assessments.controller.js';
import * as communicationsController from '../controllers/communications.controller.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  idParam, applicationCreate, applicationUpdate, applicationListQuery, statusChange,
  submissionCreate, submissionUpdate, assessmentCreate, assessmentUpdate, assessmentStatusChange,
  communicationCreate, communicationUpdate, followUpAction,
} from '../validators/index.js';

const router = Router();

router.get('/', validate({ query: applicationListQuery }), asyncHandler(applicationsController.list));
router.post('/', validate({ body: applicationCreate }), asyncHandler(applicationsController.create));
router.get('/:id', validate({ params: idParam }), asyncHandler(applicationsController.getById));
router.put('/:id', validate({ params: idParam, body: applicationUpdate }), asyncHandler(applicationsController.update));
router.patch('/:id/status', validate({ params: idParam, body: statusChange }), asyncHandler(applicationsController.changeStatus));
router.delete('/:id', validate({ params: idParam }), asyncHandler(applicationsController.remove));
router.get('/:id/history', validate({ params: idParam }), asyncHandler(applicationsController.history));

// Nested sub-resources (mergeParams so :id = application id)
const submissionsRouter = Router({ mergeParams: true });
submissionsRouter.use(validate({ params: idParam }));
submissionsRouter.get('/', asyncHandler(submissionsController.listByApplication));
submissionsRouter.post('/', validate({ body: submissionCreate }), asyncHandler(submissionsController.create));
router.use('/:id/submissions', submissionsRouter);

const assessmentsRouter = Router({ mergeParams: true });
assessmentsRouter.use(validate({ params: idParam }));
assessmentsRouter.get('/', asyncHandler(assessmentsController.listByApplication));
assessmentsRouter.post('/', validate({ body: assessmentCreate }), asyncHandler(assessmentsController.create));
router.use('/:id/assessments', assessmentsRouter);

const communicationsRouter = Router({ mergeParams: true });
communicationsRouter.use(validate({ params: idParam }));
communicationsRouter.get('/', asyncHandler(communicationsController.listByApplication));
communicationsRouter.post('/', validate({ body: communicationCreate }), asyncHandler(communicationsController.create));
router.use('/:id/communications', communicationsRouter);

export default router;

// Top-level single-resource routes
export const submissionsRouterTop = Router();
submissionsRouterTop.put('/:id', validate({ params: idParam, body: submissionUpdate }), asyncHandler(submissionsController.update));
submissionsRouterTop.delete('/:id', validate({ params: idParam }), asyncHandler(submissionsController.remove));

export const assessmentsRouterTop = Router();
assessmentsRouterTop.put('/:id', validate({ params: idParam, body: assessmentUpdate }), asyncHandler(assessmentsController.update));
assessmentsRouterTop.patch('/:id/status', validate({ params: idParam, body: assessmentStatusChange }), asyncHandler(assessmentsController.changeStatus));
assessmentsRouterTop.delete('/:id', validate({ params: idParam }), asyncHandler(assessmentsController.remove));

export const communicationsRouterTop = Router();
communicationsRouterTop.put('/:id', validate({ params: idParam, body: communicationUpdate }), asyncHandler(communicationsController.update));
communicationsRouterTop.delete('/:id', validate({ params: idParam }), asyncHandler(communicationsController.remove));
communicationsRouterTop.patch('/:id/follow-up', validate({ params: idParam, body: followUpAction }), asyncHandler(communicationsController.followUp));
