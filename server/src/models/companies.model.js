import { query, queryOne } from '../config/db.js';
import { buildInsert, buildUpdate } from './helpers.js';

const FIELDS = ['name', 'industry', 'website', 'company_size', 'notes'];

export async function list({ q } = {}) {
  if (q) {
    return query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM applications a WHERE a.company_id = c.id) AS application_count
       FROM companies c
       WHERE c.name LIKE ?
       ORDER BY c.name
       LIMIT 50`,
      [`%${q}%`]
    );
  }
  return query(
    `SELECT c.*,
            (SELECT COUNT(*) FROM applications a WHERE a.company_id = c.id) AS application_count
     FROM companies c
     ORDER BY c.name
     LIMIT 500`
  );
}

export async function findById(id) {
  return queryOne('SELECT * FROM companies WHERE id = ?', [id]);
}

export async function create(data) {
  const { sql, params } = buildInsert('companies', data);
  const result = await query(sql, params);
  return findById(result.insertId);
}

export async function update(id, data) {
  const built = buildUpdate('companies', id, data);
  if (built) await query(built.sql, built.params);
  return findById(id);
}

export async function remove(id) {
  const result = await query('DELETE FROM companies WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export { FIELDS };
