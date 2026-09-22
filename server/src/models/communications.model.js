import { query, queryOne } from '../config/db.js';
import { buildInsert, buildUpdate, keepDefaults } from './helpers.js';

const FIELDS = ['contact_person_id', 'method', 'direction', 'summary', 'details', 'occurred_at', 'follow_up_due_at'];
const DEFAULTED_NOT_NULL = ['occurred_at'];

export async function listByApplication(applicationId) {
  return query(
    `SELECT cm.*, cp.full_name AS contact_name
     FROM communications cm
     LEFT JOIN contact_persons cp ON cp.id = cm.contact_person_id
     WHERE cm.application_id = ?
     ORDER BY cm.occurred_at DESC, cm.id DESC
     LIMIT 200`,
    [applicationId]
  );
}

export async function findById(id) {
  return queryOne('SELECT * FROM communications WHERE id = ?', [id]);
}

export async function create(applicationId, data) {
  const { sql, params } = buildInsert('communications', { application_id: applicationId, ...keepDefaults(data, DEFAULTED_NOT_NULL) });
  const result = await query(sql, params);
  return findById(result.insertId);
}

export async function update(id, data) {
  const built = buildUpdate('communications', id, keepDefaults(data, DEFAULTED_NOT_NULL));
  if (built) await query(built.sql, built.params);
  return findById(id);
}

export async function remove(id) {
  const result = await query('DELETE FROM communications WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export async function listDueFollowUps() {
  return query(
    `SELECT cm.id, cm.summary, cm.method, cm.follow_up_due_at,
            a.id AS application_id, a.job_title, a.status AS application_status,
            c.id AS company_id, c.name AS company_name
     FROM communications cm
     JOIN applications a ON a.id = cm.application_id
     JOIN companies c ON c.id = a.company_id
     WHERE cm.follow_up_due_at <= NOW() AND cm.follow_up_completed_at IS NULL
     ORDER BY cm.follow_up_due_at ASC`
  );
}

export { FIELDS };
