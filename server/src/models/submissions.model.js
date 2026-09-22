import { query, queryOne } from '../config/db.js';
import { buildInsert, buildUpdate, keepDefaults } from './helpers.js';

const FIELDS = ['contact_person_id', 'channel', 'destination', 'submitted_at', 'confirmation_ref', 'attachment_name', 'notes'];
const DEFAULTED_NOT_NULL = ['submitted_at'];

export async function listByApplication(applicationId) {
  return query(
    `SELECT s.*, cp.full_name AS contact_name
     FROM submissions s
     LEFT JOIN contact_persons cp ON cp.id = s.contact_person_id
     WHERE s.application_id = ?
     ORDER BY s.submitted_at DESC, s.id DESC
     LIMIT 200`,
    [applicationId]
  );
}

export async function findById(id) {
  return queryOne('SELECT * FROM submissions WHERE id = ?', [id]);
}

export async function create(applicationId, data) {
  const { sql, params } = buildInsert('submissions', { application_id: applicationId, ...keepDefaults(data, DEFAULTED_NOT_NULL) });
  const result = await query(sql, params);
  return findById(result.insertId);
}

export async function update(id, data) {
  const built = buildUpdate('submissions', id, keepDefaults(data, DEFAULTED_NOT_NULL));
  if (built) await query(built.sql, built.params);
  return findById(id);
}

export async function remove(id) {
  const result = await query('DELETE FROM submissions WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export { FIELDS };
