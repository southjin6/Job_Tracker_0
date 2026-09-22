import { query, queryOne } from '../config/db.js';
import { buildInsert, buildUpdate } from './helpers.js';

const FIELDS = ['type', 'name', 'status', 'location', 'scheduled_at', 'completed_at', 'score', 'max_score', 'result_notes'];

export async function listByApplication(applicationId) {
  return query(
    'SELECT * FROM assessments WHERE application_id = ? ORDER BY scheduled_at IS NULL, scheduled_at ASC, id ASC LIMIT 200',
    [applicationId]
  );
}

export async function findById(id) {
  return queryOne('SELECT * FROM assessments WHERE id = ?', [id]);
}

export async function create(applicationId, data) {
  const { sql, params } = buildInsert('assessments', { application_id: applicationId, ...data });
  const result = await query(sql, params);
  return findById(result.insertId);
}

export async function update(id, data) {
  const built = buildUpdate('assessments', id, data);
  if (built) await query(built.sql, built.params);
  return findById(id);
}

export async function remove(id) {
  const result = await query('DELETE FROM assessments WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export async function listUpcoming(limit = 10) {
  return query(
    `SELECT asm.*, a.job_title, c.name AS company_name
     FROM assessments asm
     JOIN applications a ON a.id = asm.application_id
     JOIN companies c ON c.id = a.company_id
     WHERE asm.status IN ('scheduled', 'pending') AND asm.scheduled_at IS NOT NULL AND asm.scheduled_at >= NOW()
     ORDER BY asm.scheduled_at ASC
     LIMIT ?`,
    [limit]
  );
}

export { FIELDS };
