import * as communicationsModel from '../models/communications.model.js';
import * as applicationsModel from '../models/applications.model.js';
import { assertContactOfCompany } from '../services/references.js';
import { query } from '../config/db.js';
import { NotFoundError, BadRequestError } from '../utils/httpErrors.js';
import { pick } from '../models/helpers.js';
import { FIELDS } from '../models/communications.model.js';

const sameInstant = (a, b) =>
  a == null && b == null ? true : a != null && b != null && String(a).replace('T', ' ').slice(0, 19) === String(b).replace('T', ' ').slice(0, 19);

export async function listByApplication(req, res) {
  const application = await applicationsModel.findById(req.params.id);
  if (!application) throw new NotFoundError('Application');
  res.json(await communicationsModel.listByApplication(application.id));
}

export async function create(req, res) {
  const application = await applicationsModel.findById(req.params.id);
  if (!application) throw new NotFoundError('Application');
  const data = pick(req.body, FIELDS);
  if (data.contact_person_id) await assertContactOfCompany(data.contact_person_id, application.company_id);
  const communication = await communicationsModel.create(application.id, data);
  res.status(201).json(communication);
}

export async function update(req, res) {
  const existing = await communicationsModel.findById(req.params.id);
  if (!existing) throw new NotFoundError('Communication');
  const data = pick(req.body, FIELDS);
  if (data.contact_person_id) {
    const application = await applicationsModel.findById(existing.application_id);
    await assertContactOfCompany(data.contact_person_id, application.company_id);
  }
  // Re-arming a finished follow-up with a NEW due date must clear its completion,
  // otherwise it stays hidden from /follow-ups/due forever (snooze was the only reset).
  if ('follow_up_due_at' in data && data.follow_up_due_at != null && existing.follow_up_completed_at
    && !sameInstant(data.follow_up_due_at, existing.follow_up_due_at)) {
    data.follow_up_completed_at = null;
  }
  res.json(await communicationsModel.update(req.params.id, data));
}

export async function remove(req, res) {
  const existing = await communicationsModel.findById(req.params.id);
  if (!existing) throw new NotFoundError('Communication');
  await communicationsModel.remove(req.params.id);
  res.status(204).end();
}

export async function followUp(req, res) {
  const existing = await communicationsModel.findById(req.params.id);
  if (!existing) throw new NotFoundError('Communication');
  if (!existing.follow_up_due_at) throw new BadRequestError('This communication has no follow-up.');

  if (req.body.action === 'complete') {
    await query('UPDATE communications SET follow_up_completed_at = NOW() WHERE id = ?', [existing.id]);
  } else {
    await query(
      'UPDATE communications SET follow_up_due_at = ?, follow_up_completed_at = NULL WHERE id = ?',
      [req.body.due_at, existing.id]
    );
  }
  res.json(await communicationsModel.findById(existing.id));
}

export async function dueFollowUps(req, res) {
  res.json(await communicationsModel.listDueFollowUps());
}
