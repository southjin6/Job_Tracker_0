import { query, queryOne } from '../config/db.js';
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

// Moving an application between companies must not leave its children pointing at
// contacts of the previous company: the server would then reject those very rows.
export async function assertNoForeignChildContacts(applicationId, companyId) {
  const rows = await query(
    `SELECT 'submission' AS kind, s.id
       FROM submissions s
       JOIN contact_persons cp ON cp.id = s.contact_person_id
      WHERE s.application_id = ? AND cp.company_id <> ?
     UNION ALL
     SELECT 'communication', c.id
       FROM communications c
       JOIN contact_persons cp ON cp.id = c.contact_person_id
      WHERE c.application_id = ? AND cp.company_id <> ?`,
    [applicationId, companyId, applicationId, companyId]
  );
  if (!rows.length) return;
  const counts = rows.reduce((acc, r) => ({ ...acc, [r.kind]: (acc[r.kind] || 0) + 1 }), {});
  const detail = Object.entries(counts)
    .map(([kind, n]) => `${n} ${kind}${n > 1 ? 's' : ''} ${n > 1 ? 'still reference' : 'still references'}`)
    .join(' and ');
  throw new BadRequestError(
    `Cannot change company: ${detail} a contact of the current company. Re-point them at a contact of the new company (or clear them) first.`
  );
}
