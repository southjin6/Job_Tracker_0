import * as applicationsModel from '../models/applications.model.js';
import * as statusHistoryModel from '../models/statusHistory.model.js';
import * as submissionsModel from '../models/submissions.model.js';
import * as assessmentsModel from '../models/assessments.model.js';
import * as communicationsModel from '../models/communications.model.js';
import * as applicationsService from '../services/applications.service.js';
import { assertBranchOfCompany } from '../services/references.js';
import { NotFoundError } from '../utils/httpErrors.js';
import { pick } from '../models/helpers.js';
import { FIELDS } from '../models/applications.model.js';

export async function list(req, res) {
  res.json(await applicationsModel.list(req.query));
}

export async function create(req, res) {
  const data = pick(req.body, FIELDS);
  if (data.branch_id) await assertBranchOfCompany(data.branch_id, data.company_id);
  const application = await applicationsService.createApplication(data);
  res.status(201).json(application);
}

export async function getById(req, res) {
  const application = await applicationsService.getApplicationDetail(req.params.id);
  const [history, submissions, assessments, communications] = await Promise.all([
    statusHistoryModel.listByApplication(application.id),
    submissionsModel.listByApplication(application.id),
    assessmentsModel.listByApplication(application.id),
    communicationsModel.listByApplication(application.id),
  ]);
  res.json({ ...application, history, submissions, assessments, communications });
}

export async function update(req, res) {
  const existing = await applicationsModel.findById(req.params.id);
  if (!existing) throw new NotFoundError('Application');
  // status changes must go through PATCH /status (transactional + history)
  const data = pick(req.body, FIELDS);
  if (data.branch_id) {
    await assertBranchOfCompany(data.branch_id, data.company_id ?? existing.company_id);
  } else if (data.company_id && existing.branch_id) {
    await assertBranchOfCompany(existing.branch_id, data.company_id);
  }
  res.json(await applicationsModel.update(req.params.id, data));
}

export async function changeStatus(req, res) {
  const application = await applicationsService.changeStatus(
    req.params.id,
    req.body.status,
    req.body.note
  );
  res.json(application);
}

export async function remove(req, res) {
  const existing = await applicationsModel.findById(req.params.id);
  if (!existing) throw new NotFoundError('Application');
  await applicationsModel.remove(req.params.id);
  res.status(204).end();
}

export async function history(req, res) {
  const existing = await applicationsModel.findById(req.params.id);
  if (!existing) throw new NotFoundError('Application');
  res.json(await statusHistoryModel.listByApplication(req.params.id));
}
