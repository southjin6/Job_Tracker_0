export const STATUSES = ['submitted', 'assessment', 'interview', 'offer', 'hired', 'rejected', 'withdrawn', 'ghosted'];

export const STATUS_LABELS = {
  submitted: 'Submitted',
  assessment: 'Assessment',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  ghosted: 'Ghosted',
};

export const STATUS_COLORS = {
  submitted: 'bg-blue-100 text-blue-800',
  assessment: 'bg-purple-100 text-purple-800',
  interview: 'bg-amber-100 text-amber-800',
  offer: 'bg-green-100 text-green-800',
  hired: 'bg-emerald-200 text-emerald-900',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-200 text-gray-700',
  ghosted: 'bg-gray-300 text-gray-600',
};

export const PRIORITY_LABELS = { 1: 'Hot', 2: 'Normal', 3: 'Low' };

export const COMM_METHODS = [
  { value: 'email', label: 'Email' },
  { value: 'call', label: 'Call' },
  { value: 'sms', label: 'SMS' },
  { value: 'chat', label: 'Chat' },
  { value: 'in_person', label: 'In person' },
  { value: 'note', label: 'Note' },
];

export const ASSESSMENT_TYPES = [
  { value: 'technical', label: 'Technical' },
  { value: 'buplas', label: 'BUPLAS' },
  { value: 'language', label: 'Language' },
  { value: 'personality', label: 'Personality' },
  { value: 'skills_test', label: 'Skills test' },
  { value: 'interview_task', label: 'Interview task' },
  { value: 'medical', label: 'Medical' },
  { value: 'other', label: 'Other' },
];

export const ASSESSMENT_STATUSES = [
  'scheduled', 'pending', 'in_progress', 'completed', 'passed', 'failed', 'no_show', 'cancelled',
];

// DB ("2026-09-24 09:00:00") <-> datetime-local input ("2026-09-24T09:00")
export function toInputDateTime(value) {
  if (!value) return '';
  return String(value).slice(0, 16).replace(' ', 'T');
}

export function fromInputDateTime(value) {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;
}

export const SUBMISSION_CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'portal', label: 'Portal' },
  { value: 'job_board', label: 'Job board' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'referral', label: 'Referral' },
  { value: 'phone', label: 'Phone' },
  { value: 'other', label: 'Other' },
];

export const ROLE_LABELS = { it: 'IT', service_desk: 'Service Desk', data: 'Data', other: 'Other' };

export function formatDate(value) {
  if (!value) return '—';
  return String(value).slice(0, 10);
}

// toISOString() is UTC; the DB and this user's day are local (UTC+8), so a pre-fill
// built from it reads as yesterday before 08:00 local.
export function todayLocalDate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Same local-time rule for datetime-local inputs ("2026-09-22T18:40").
export function nowLocalDateTime() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${todayLocalDate()}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDateTime(value) {
  if (!value) return '—';
  return String(value).slice(0, 16).replace('T', ' ');
}

export function confirmDeleteApplication(app) {
  return window.confirm(
    `Delete "${app.job_title}" at ${app.company_name}?\n\nIts submissions, assessments, communications, and status history will also be deleted. This cannot be undone.`
  );
}
