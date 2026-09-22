import { queryOne } from '../config/db.js';
import { BadRequestError } from '../utils/httpErrors.js';

// The FK only proves the row exists — these checks stop branch/contact ids
// from another company being attached to an application or communication.
export async function assertBranchOfCompany(branchId, companyId) {
  const row = await queryOne('SELECT id FROM company_branches WHERE id = ? AND company_id = ?', [branchId, companyId]);
  if (!row) throw new BadRequestError('branch_id does not belong to this company.');
}

export async function assertContactOfCompany(contactId, companyId) {
  const row = await queryOne('SELECT id FROM contact_persons WHERE id = ? AND company_id = ?', [contactId, companyId]);
  if (!row) throw new BadRequestError('contact_person_id does not belong to this company.');
}
