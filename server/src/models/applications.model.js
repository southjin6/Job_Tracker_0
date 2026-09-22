import { query, queryOne } from '../config/db.js';
import { buildInsert, buildUpdate } from './helpers.js';

const FIELDS = [
  'company_id', 'branch_id', 'job_title', 'role_category', 'source', 'posting_url',
  'applied_at', 'salary_asked', 'salary_offered', 'priority', 'notes',
];

const SORTS = {
  recent: 'a.applied_at DESC, a.id DESC',
  priority: 'a.priority ASC, a.status_changed_at DESC',
  status_changed: 'a.status_changed_at DESC',
};

export async function list({ status, company_id, q, sort = 'recent' } = {}) {
  const where = [];
  const params = [];
  if (status) { where.push('a.status = ?'); params.push(status); }
  if (company_id) { where.push('a.company_id = ?'); params.push(company_id); }
  if (q) { where.push('(a.job_title LIKE ? OR c.name LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return query(
    `SELECT a.*, c.name AS company_name, b.label AS branch_label
     FROM applications a
     JOIN companies c ON c.id = a.company_id
     LEFT JOIN company_branches b ON b.id = a.branch_id
     ${whereSql}
     ORDER BY ${SORTS[sort] ?? SORTS.recent}
     LIMIT 500`,
    params
  );
}

export async function findById(id) {
  return queryOne(
    `SELECT a.*, c.name AS company_name, b.label AS branch_label
     FROM applications a
     JOIN companies c ON c.id = a.company_id
     LEFT JOIN company_branches b ON b.id = a.branch_id
     WHERE a.id = ?`,
    [id]
  );
}

export async function create(data) {
  const { sql, params } = buildInsert('applications', data);
  const result = await query(sql, params);
  return findById(result.insertId);
}

export async function update(id, data) {
  const built = buildUpdate('applications', id, data);
  if (built) await query(built.sql, built.params);
  return findById(id);
}

export async function remove(id) {
  const result = await query('DELETE FROM applications WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export { FIELDS };
