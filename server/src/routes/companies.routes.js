import { Router } from 'express';
import * as controller from '../controllers/companies.controller.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParam, companyCreate, companyUpdate, companyListQuery } from '../validators/index.js';

const router = Router();

router.get('/', validate({ query: companyListQuery }), asyncHandler(controller.list));
router.post('/', validate({ body: companyCreate }), asyncHandler(controller.create));
router.get('/:id', validate({ params: idParam }), asyncHandler(controller.getById));
router.put('/:id', validate({ params: idParam, body: companyUpdate }), asyncHandler(controller.update));
router.delete('/:id', validate({ params: idParam }), asyncHandler(controller.remove));

export default router;
