import { pool, queryOne } from '../config/db.js';
import * as applicationsModel from '../models/applications.model.js';
import * as statusHistoryModel from '../models/statusHistory.model.js';
import { NotFoundError, ConflictError } from '../utils/httpErrors.js';

// Create application + first history row (null -> submitted) atomically.
export async function createApplication(data) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { sql, params } = buildCreate(data);
    const [result] = await conn.query(sql, params);
    const id = result.insertId;
    await conn.query(
      "INSERT INTO application_status_history (application_id, old_status, new_status, note) VALUES (?, NULL, 'submitted', 'Initial log')",
      [id]
    );
    await conn.commit();
    return applicationsModel.findById(id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

function buildCreate(data) {
  const keys = Object.keys(data);
  return {
    sql: `INSERT INTO applications (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
    params: keys.map((k) => data[k] ?? null),
  };
}

// Transactional status change: UPDATE applications + INSERT history row.
export async function changeStatus(applicationId, newStatus, note) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT id, status FROM applications WHERE id = ? FOR UPDATE', [applicationId]);
    if (!rows.length) throw new NotFoundError('Application');
    const oldStatus = rows[0].status;
    if (oldStatus === newStatus) throw new ConflictError(`Application is already '${newStatus}'.`);

    await conn.query('UPDATE applications SET status = ?, status_changed_at = NOW() WHERE id = ?', [newStatus, applicationId]);
    await statusHistoryModel.insert(conn, { applicationId, oldStatus, newStatus, note });
    await conn.commit();
    return applicationsModel.findById(applicationId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function getApplicationDetail(id) {
  const application = await applicationsModel.findById(id);
  if (!application) throw new NotFoundError('Application');
  return application;
}

export async function getStaleApplications(days = 14) {
  const rows = await queryOne(
    `SELECT COUNT(*) AS stale_count FROM applications
     WHERE status IN ('submitted','assessment','interview') AND status_changed_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [days]
  );
  return rows?.stale_count ?? 0;
}
