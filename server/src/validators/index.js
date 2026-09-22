import { z } from 'zod';

export const APPLICATION_STATUSES = ['submitted', 'assessment', 'interview', 'offer', 'hired', 'rejected', 'withdrawn', 'ghosted'];
export const SUBMISSION_CHANNELS = ['email', 'portal', 'walk_in', 'referral', 'phone', 'job_board', 'other'];
export const ASSESSMENT_TYPES = ['technical', 'buplas', 'language', 'personality', 'skills_test', 'interview_task', 'medical', 'other'];
export const ASSESSMENT_STATUSES = ['scheduled', 'pending', 'in_progress', 'completed', 'passed', 'failed', 'no_show', 'cancelled'];
export const COMM_METHODS = ['email', 'call', 'sms', 'chat', 'in_person', 'note'];
export const COMM_DIRECTIONS = ['inbound', 'outbound'];

export const idParam = z.object({ id: z.coerce.number().int().positive() });

// Browsers happily send ?status=&q= — treat empty values as "not provided".
const emptyToUndefined = (v) => (v === '' ? undefined : v);
const optionalEmpty = (schema) => z.preprocess(emptyToUndefined, schema.optional());

// Clients send naive local "2026-09-24T09:00[:00]"; normalize to MySQL DATETIME
// text so trailing Z/offsets/fractional seconds can't reach SQL as invalid values.
const toMysqlDateTime = (v) =>
  v.replace('T', ' ').replace(/[Zz]$/, '').replace(/[+-]\d{2}:\d{2}$/, '').replace(/\.\d+$/, '').slice(0, 19);
const dateTimeLocal = z.string().datetime({ local: true }).transform(toMysqlDateTime);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD')
  .refine((v) => {
    const [y, m, d] = v.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }, 'not a real calendar date');

const longText = z.string().trim().max(16_000).nullish(); // TEXT columns cap at 65535 bytes

// ---------- companies ----------
export const companyCreate = z.object({
  name: z.string().trim().min(1).max(200),
  industry: z.string().trim().max(100).nullish(),
  website: z.string().trim().max(255).nullish(),
  company_size: z.string().trim().max(50).nullish(),
  notes: longText,
});
export const companyUpdate = companyCreate.partial();
export const companyListQuery = z.object({ q: optionalEmpty(z.string().trim()) });

// ---------- branches ----------
export const branchCreate = z.object({
  label: z.string().trim().min(1).max(100).default('Main'),
  address_line: z.string().trim().max(255).nullish(),
  city: z.string().trim().max(100).nullish(),
  province: z.string().trim().max(100).nullish(),
  region: z.string().trim().max(100).nullish(),
  postal_code: z.string().trim().max(10).nullish(),
  is_primary: z.union([z.boolean(), z.number().int().min(0).max(1)]).default(false),
  notes: longText,
});
export const branchUpdate = branchCreate.partial();

// ---------- contacts ----------
export const contactCreate = z.object({
  branch_id: z.number().int().positive().nullish(),
  full_name: z.string().trim().min(1).max(150),
  job_title: z.string().trim().max(150).nullish(),
  email: z.string().trim().max(255).nullish(),
  phone: z.string().trim().max(50).nullish(),
  preferred_channel: z.enum(['email', 'call', 'sms', 'chat']).nullish(),
  is_primary: z.union([z.boolean(), z.number().int().min(0).max(1)]).default(false),
  notes: longText,
});
export const contactUpdate = contactCreate.partial();

// ---------- applications ----------
export const applicationCreate = z.object({
  company_id: z.number().int().positive(),
  branch_id: z.number().int().positive().nullish(),
  job_title: z.string().trim().min(1).max(200),
  role_category: z.enum(['it', 'service_desk', 'data', 'other']).default('it'),
  source: z.string().trim().max(100).nullish(),
  posting_url: z.string().trim().max(500).nullish(),
  applied_at: isoDate,
  salary_asked: z.number().nonnegative().max(99_999_999.99).nullish(), // DECIMAL(10,2)
  salary_offered: z.number().nonnegative().max(99_999_999.99).nullish(),
  priority: z.number().int().min(1).max(3).default(2),
  notes: longText,
});
export const applicationUpdate = applicationCreate.partial();
export const applicationListQuery = z.object({
  status: optionalEmpty(z.enum(APPLICATION_STATUSES)),
  company_id: optionalEmpty(z.coerce.number().int().positive()),
  q: optionalEmpty(z.string().trim()),
  sort: optionalEmpty(z.enum(['recent', 'priority', 'status_changed'])),
});
export const statusChange = z.object({
  status: z.enum(APPLICATION_STATUSES),
  note: z.string().trim().max(500).nullish(),
});

// ---------- submissions ----------
export const submissionCreate = z.object({
  contact_person_id: z.number().int().positive().nullish(),
  channel: z.enum(SUBMISSION_CHANNELS),
  destination: z.string().trim().min(1).max(300),
  submitted_at: dateTimeLocal.nullish(),
  confirmation_ref: z.string().trim().max(100).nullish(),
  attachment_name: z.string().trim().max(255).nullish(),
  notes: longText,
});
export const submissionUpdate = submissionCreate.partial();

// ---------- assessments ----------
const assessmentFields = z.object({
  type: z.enum(ASSESSMENT_TYPES).default('technical'),
  name: z.string().trim().max(200).nullish(),
  status: z.enum(ASSESSMENT_STATUSES).default('scheduled'),
  location: z.string().trim().max(300).nullish(),
  scheduled_at: dateTimeLocal.nullish(),
  completed_at: dateTimeLocal.nullish(),
  score: z.number().min(0).max(9999.99).nullish(), // DECIMAL(6,2)
  max_score: z.number().min(0.01).max(9999.99).nullish(),
  result_notes: longText,
});
function checkAssessmentScores(data, ctx) {
  if (data.score != null && data.max_score != null && data.score > data.max_score) {
    ctx.addIssue({ code: 'custom', message: 'score cannot exceed max_score', path: ['score'] });
  }
}
export const assessmentCreate = assessmentFields.superRefine(checkAssessmentScores);
export const assessmentUpdate = assessmentFields.partial().superRefine(checkAssessmentScores);
export const assessmentStatusChange = z.object({ status: z.enum(ASSESSMENT_STATUSES) });

// ---------- communications ----------
export const communicationCreate = z.object({
  contact_person_id: z.number().int().positive().nullish(),
  method: z.enum(COMM_METHODS),
  direction: z.enum(COMM_DIRECTIONS).default('outbound'),
  summary: z.string().trim().min(1).max(255),
  details: longText,
  occurred_at: dateTimeLocal.nullish(),
  follow_up_due_at: dateTimeLocal.nullish(),
});
export const communicationUpdate = communicationCreate.partial();
export const followUpAction = z.object({
  action: z.enum(['complete', 'snooze']),
  due_at: dateTimeLocal.optional(),
}).refine((v) => v.action !== 'snooze' || v.due_at, { message: 'snooze requires due_at' });
