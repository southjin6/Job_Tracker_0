import * as assessmentsModel from '../models/assessments.model.js';
import * as applicationsModel from '../models/applications.model.js';
import { query } from '../config/db.js';
import { NotFoundError, BadRequestError } from '../utils/httpErrors.js';
import { pick } from '../models/helpers.js';
import { FIELDS } from '../models/assessments.model.js';

const TERMINAL_STATUSES = ['completed', 'passed', 'failed', 'no_show', 'cancelled'];

// completed_at defaults to MySQL NOW() so it shares the session timezone with every other timestamp.
async function stampCompletedAt(assessment) {
  if (!assessment || !TERMINAL_STATUSES.includes(assessment.status) || assessment.completed_at) return assessment;
  await query('UPDATE assessments SET completed_at = NOW() WHERE id = ?', [assessment.id]);
  return assessmentsModel.findById(assessment.id);
}

// zod can only compare fields present in the request body, so a partial PUT could
// push score past the max_score already stored on the row (or lower max under score).
function assertScoreWithinStoredMax(existing, data) {
  const score = Number('score' in data ? data.score : existing.score);
  const max = Number('max_score' in data ? data.max_score : existing.max_score);
  if (Number.isFinite(score) && Number.isFinite(max) && max > 0 && score > max) {
    throw new BadRequestError(`score cannot exceed max_score (${max}).`);
  }
}

export async function listByApplication(req, res) {
  const application = await applicationsModel.findById(req.params.id);
  if (!application) throw new NotFoundError('Application');
  res.json(await assessmentsModel.listByApplication(application.id));
}

export async function create(req, res) {
  const application = await applicationsModel.findById(req.params.id);
  if (!application) throw new NotFoundError('Application');
  const assessment = await assessmentsModel.create(application.id, pick(req.body, FIELDS));
  res.status(201).json(await stampCompletedAt(assessment));
}

export async function update(req, res) {
  const existing = await assessmentsModel.findById(req.params.id);
  if (!existing) throw new NotFoundError('Assessment');
  const data = pick(req.body, FIELDS);
  assertScoreWithinStoredMax(existing, data);
  const updated = await assessmentsModel.update(req.params.id, data);
  res.json(await stampCompletedAt(updated));
}

export async function changeStatus(req, res) {
  const existing = await assessmentsModel.findById(req.params.id);
  if (!existing) throw new NotFoundError('Assessment');
  const updated = await assessmentsModel.update(req.params.id, { status: req.body.status });
  res.json(await stampCompletedAt(updated));
}

export async function remove(req, res) {
  const existing = await assessmentsModel.findById(req.params.id);
  if (!existing) throw new NotFoundError('Assessment');
  await assessmentsModel.remove(req.params.id);
  res.status(204).end();
}
