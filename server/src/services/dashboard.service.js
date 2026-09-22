import { query } from '../config/db.js';
import * as communicationsModel from '../models/communications.model.js';
import * as assessmentsModel from '../models/assessments.model.js';
import { getStaleApplications } from './applications.service.js';

export async function getStats() {
  const byStatus = await query(
    'SELECT status, COUNT(*) AS count FROM applications GROUP BY status'
  );
  const totals = await query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(applied_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)), 0) AS last_7_days
     FROM applications`
  );
  const followUpsDue = await communicationsModel.listDueFollowUps();
  const upcomingAssessments = await assessmentsModel.listUpcoming(5);
  const staleCount = await getStaleApplications(14);

  return {
    by_status: byStatus,
    total_applications: totals[0].total,
    applied_last_7_days: Number(totals[0].last_7_days),
    follow_ups_due: followUpsDue,
    upcoming_assessments: upcomingAssessments,
    stale_applications: staleCount,
  };
}

export async function getPipeline() {
  const rows = await query(
    `SELECT a.id, a.job_title, a.status, a.priority, a.applied_at, a.status_changed_at,
            c.id AS company_id, c.name AS company_name, b.label AS branch_label
     FROM applications a
     JOIN companies c ON c.id = a.company_id
     LEFT JOIN company_branches b ON b.id = a.branch_id
     ORDER BY a.priority ASC, a.status_changed_at DESC
     LIMIT 500`
  );
  const columns = {};
  for (const row of rows) {
    (columns[row.status] ??= []).push(row);
  }
  return columns;
}
