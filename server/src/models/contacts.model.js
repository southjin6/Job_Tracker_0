import { query, queryOne } from '../config/db.js';
import { buildInsert, buildUpdate } from './helpers.js';

const FIELDS = ['branch_id', 'full_name', 'job_title', 'email', 'phone', 'preferred_channel', 'is_primary', 'notes'];

export async function listByCompany(companyId) {
  return query('SELECT * FROM contact_persons WHERE company_id = ? ORDER BY is_primary DESC, full_name LIMIT 100', [companyId]);
}

export async function findById(id) {
  return queryOne('SELECT * FROM contact_persons WHERE id = ?', [id]);
}

export async function create(companyId, data) {
  const { sql, params } = buildInsert('contact_persons', { company_id: companyId, ...data });
  const result = await query(sql, params);
  return findById(result.insertId);
}

export async function update(id, data) {
  const built = buildUpdate('contact_persons', id, data);
  if (built) await query(built.sql, built.params);
  return findById(id);
}

export async function remove(id) {
  const result = await query('DELETE FROM contact_persons WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export { FIELDS };
