import * as contactsModel from '../models/contacts.model.js';
import * as companiesModel from '../models/companies.model.js';
import { assertBranchOfCompany } from '../services/references.js';
import { NotFoundError } from '../utils/httpErrors.js';
import { pick } from '../models/helpers.js';
import { FIELDS } from '../models/contacts.model.js';

export async function listByCompany(req, res) {
  const company = await companiesModel.findById(req.params.id);
  if (!company) throw new NotFoundError('Company');
  res.json(await contactsModel.listByCompany(company.id));
}

export async function create(req, res) {
  const company = await companiesModel.findById(req.params.id);
  if (!company) throw new NotFoundError('Company');
  const data = pick(req.body, FIELDS);
  if (data.branch_id) await assertBranchOfCompany(data.branch_id, company.id);
  const contact = await contactsModel.create(company.id, data);
  res.status(201).json(contact);
}

export async function update(req, res) {
  const existing = await contactsModel.findById(req.params.id);
  if (!existing) throw new NotFoundError('Contact');
  const data = pick(req.body, FIELDS);
  if (data.branch_id) await assertBranchOfCompany(data.branch_id, existing.company_id);
  res.json(await contactsModel.update(req.params.id, data));
}

export async function remove(req, res) {
  const existing = await contactsModel.findById(req.params.id);
  if (!existing) throw new NotFoundError('Contact');
  await contactsModel.remove(req.params.id);
  res.status(204).end();
}
