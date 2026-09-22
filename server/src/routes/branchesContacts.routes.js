import { Router } from 'express';
import * as branchesController from '../controllers/branches.controller.js';
import * as contactsController from '../controllers/contacts.controller.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParam, branchCreate, branchUpdate, contactCreate, contactUpdate } from '../validators/index.js';

// Nested under /companies/:id
export const companyBranchesRouter = Router({ mergeParams: true });
companyBranchesRouter.use(validate({ params: idParam }));
companyBranchesRouter.get('/', asyncHandler(branchesController.listByCompany));
companyBranchesRouter.post('/', validate({ body: branchCreate }), asyncHandler(branchesController.create));

export const companyContactsRouter = Router({ mergeParams: true });
companyContactsRouter.use(validate({ params: idParam }));
companyContactsRouter.get('/', asyncHandler(contactsController.listByCompany));
companyContactsRouter.post('/', validate({ body: contactCreate }), asyncHandler(contactsController.create));

// Top-level /branches/:id
export const branchesRouter = Router();
branchesRouter.put('/:id', validate({ params: idParam, body: branchUpdate }), asyncHandler(branchesController.update));
branchesRouter.delete('/:id', validate({ params: idParam }), asyncHandler(branchesController.remove));

// Top-level /contacts/:id
export const contactsRouter = Router();
contactsRouter.put('/:id', validate({ params: idParam, body: contactUpdate }), asyncHandler(contactsController.update));
contactsRouter.delete('/:id', validate({ params: idParam }), asyncHandler(contactsController.remove));
