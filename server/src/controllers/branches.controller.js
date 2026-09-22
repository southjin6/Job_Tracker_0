import * as branchesModel from '../models/branches.model.js';
import * as companiesModel from '../models/companies.model.js';
import { queryOne } from '../config/db.js';
import { NotFoundError, ConflictError } from '../utils/httpErrors.js';
import { pick } from '../models/helpers.js';
import { FIELDS } from '../models/branches.model.js';

export async function listByCompany(req, res) {
  const company = await companiesModel.findById(req.params.id);
  if (!company) throw new NotFoundError('Company');
  res.json(await branchesModel.listByCompany(company.id));
}

export async function create(req, res) {
  const company = await companiesModel.findById(req.params.id);
  if (!company) throw new NotFoundError('Company');
  const branch = await branchesModel.create(company.id, pick(req.body, FIELDS));
  res.status(201).json(branch);
}

export async function update(req, res) {
  const existing = await branchesModel.findById(req.params.id);
  if (!existing) throw new NotFoundError('Branch');
  res.json(await branchesModel.update(req.params.id, pick(req.body, FIELDS)));
}

export async function remove(req, res) {
  const existing = await branchesModel.findById(req.params.id);
  if (!existing) throw new NotFoundError('Branch');
  // Both FKs are ON DELETE SET NULL: without this guard, deleting a branch silently blanks
  // applications.branch_id / contact_persons.branch_id instead of warning dependents exist.
  const refs = await queryOne(
    `SELECT (SELECT COUNT(*) FROM applications WHERE branch_id = ?) AS apps,
            (SELECT COUNT(*) FROM contact_persons WHERE branch_id = ?) AS contacts`,
    [existing.id, existing.id]
  );
  const parts = [];
  if (Number(refs.apps) > 0) parts.push(`${refs.apps} application(s)`);
  if (Number(refs.contacts) > 0) parts.push(`${refs.contacts} contact(s)`);
  if (parts.length) {
    throw new ConflictError(`${parts.join(' and ')} still use this branch — reassign or delete them first.`);
  }
  await branchesModel.remove(req.params.id);
  res.status(204).end();
}
