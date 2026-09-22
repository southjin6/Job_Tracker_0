import * as submissionsModel from '../models/submissions.model.js';
import * as applicationsModel from '../models/applications.model.js';
import { assertContactOfCompany } from '../services/references.js';
import { NotFoundError } from '../utils/httpErrors.js';
import { pick } from '../models/helpers.js';
import { FIELDS } from '../models/submissions.model.js';

export async function listByApplication(req, res) {
  const application = await applicationsModel.findById(req.params.id);
  if (!application) throw new NotFoundError('Application');
  res.json(await submissionsModel.listByApplication(application.id));
}

export async function create(req, res) {
  const application = await applicationsModel.findById(req.params.id);
  if (!application) throw new NotFoundError('Application');
  const data = pick(req.body, FIELDS);
  if (data.contact_person_id) await assertContactOfCompany(data.contact_person_id, application.company_id);
  const submission = await submissionsModel.create(application.id, data);
  res.status(201).json(submission);
}

export async function update(req, res) {
  const existing = await submissionsModel.findById(req.params.id);
  if (!existing) throw new NotFoundError('Submission');
  const data = pick(req.body, FIELDS);
  if (data.contact_person_id) {
    const application = await applicationsModel.findById(existing.application_id);
    await assertContactOfCompany(data.contact_person_id, application.company_id);
  }
  res.json(await submissionsModel.update(req.params.id, data));
}

export async function remove(req, res) {
  const existing = await submissionsModel.findById(req.params.id);
  if (!existing) throw new NotFoundError('Submission');
  await submissionsModel.remove(req.params.id);
  res.status(204).end();
}
