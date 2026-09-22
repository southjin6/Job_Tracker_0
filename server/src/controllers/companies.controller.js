import * as companiesModel from '../models/companies.model.js';
import * as branchesModel from '../models/branches.model.js';
import * as contactsModel from '../models/contacts.model.js';
import { query } from '../config/db.js';
import { NotFoundError } from '../utils/httpErrors.js';
import { pick } from '../models/helpers.js';
import { FIELDS } from '../models/companies.model.js';

export async function list(req, res) {
  res.json(await companiesModel.list({ q: req.query.q }));
}

export async function create(req, res) {
  const company = await companiesModel.create(pick(req.body, FIELDS));
  res.status(201).json(company);
}

export async function getById(req, res) {
  const company = await companiesModel.findById(req.params.id);
  if (!company) throw new NotFoundError('Company');
  const [branches, contacts, applications] = await Promise.all([
    branchesModel.listByCompany(company.id),
    contactsModel.listByCompany(company.id),
    query(
      `SELECT id, job_title, status, applied_at, priority
       FROM applications WHERE company_id = ? ORDER BY applied_at DESC`,
      [company.id]
    ),
  ]);
  res.json({ ...company, branches, contacts, applications });
}

export async function update(req, res) {
  const existing = await companiesModel.findById(req.params.id);
  if (!existing) throw new NotFoundError('Company');
  res.json(await companiesModel.update(req.params.id, pick(req.body, FIELDS)));
}

export async function remove(req, res) {
  const existing = await companiesModel.findById(req.params.id);
  if (!existing) throw new NotFoundError('Company');
  // FK RESTRICT raises ER_ROW_IS_REFERENCED_2 -> errorHandler maps to 409
  await companiesModel.remove(req.params.id);
  res.status(204).end();
}
