import { query, queryOne } from '../config/db.js';
import { buildInsert, buildUpdate } from './helpers.js';

const FIELDS = ['label', 'address_line', 'city', 'province', 'region', 'postal_code', 'is_primary', 'notes'];

export async function listByCompany(companyId) {
  return query('SELECT * FROM company_branches WHERE company_id = ? ORDER BY is_primary DESC, label LIMIT 100', [companyId]);
}

export async function findById(id) {
  return queryOne('SELECT * FROM company_branches WHERE id = ?', [id]);
}

export async function create(companyId, data) {
  const { sql, params } = buildInsert('company_branches', { company_id: companyId, ...data });
  const result = await query(sql, params);
  return findById(result.insertId);
}

export async function update(id, data) {
  const built = buildUpdate('company_branches', id, data);
  if (built) await query(built.sql, built.params);
  return findById(id);
}

export async function remove(id) {
  const result = await query('DELETE FROM company_branches WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export { FIELDS };
