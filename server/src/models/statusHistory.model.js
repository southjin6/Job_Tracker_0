import { query } from '../config/db.js';

export async function listByApplication(applicationId) {
  return query(
    'SELECT * FROM application_status_history WHERE application_id = ? ORDER BY changed_at ASC, id ASC LIMIT 200',
    [applicationId]
  );
}

// Usually called inside the status-change transaction with a connection instead.
export async function insert(connection, { applicationId, oldStatus, newStatus, note }) {
  await connection.query(
    'INSERT INTO application_status_history (application_id, old_status, new_status, note) VALUES (?, ?, ?, ?)',
    [applicationId, oldStatus, newStatus, note ?? null]
  );
}
