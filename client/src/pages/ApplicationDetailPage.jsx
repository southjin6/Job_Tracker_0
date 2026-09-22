import { Link, useParams, useNavigate } from 'react-router-dom'
import { useApplication, useChangeStatus, useDeleteApplication, useUpdateApplication, useUpdateSubmission, useUpdateAssessment, useUpdateCommunication } from '../api/hooks.js'
import { STATUSES, STATUS_LABELS, STATUS_COLORS, SUBMISSION_CHANNELS, ROLE_LABELS, PRIORITY_LABELS, COMM_METHODS, ASSESSMENT_TYPES, ASSESSMENT_STATUSES, formatDate, formatDateTime, confirmDeleteApplication, toInputDateTime, fromInputDateTime } from '../lib/statuses.js'
import { useState } from 'react'

function SubmissionItem({ submission }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ channel: submission.channel, destination: submission.destination })
  const update = useUpdateSubmission()

  if (!editing) {
    return (
      <li className="flex items-center justify-between gap-3 py-1.5">
        <div>
          <span className="font-medium capitalize">{submission.channel.replace('_', ' ')}</span> → {submission.destination}
          <span className="text-xs text-slate-400"> · {formatDateTime(submission.submitted_at)}</span>
          {submission.confirmation_ref && <span className="text-xs text-slate-500"> · ref {submission.confirmation_ref}</span>}
        </div>
        <button
          onClick={() => { setDraft({ channel: submission.channel, destination: submission.destination }); setEditing(true) }}
          className="shrink-0 rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
        >
          Edit
        </button>
      </li>
    )
  }

  const save = () => {
    update.mutate(
      { id: submission.id, channel: draft.channel, destination: draft.destination.trim() },
      { onSuccess: () => setEditing(false) }
    )
  }

  return (
    <li className="flex flex-wrap items-center gap-2 py-1.5">
      <select
        value={draft.channel}
        onChange={(e) => setDraft({ ...draft, channel: e.target.value })}
        className="rounded border border-slate-300 p-1 text-sm"
      >
        {SUBMISSION_CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <input
        value={draft.destination}
        onChange={(e) => setDraft({ ...draft, destination: e.target.value })}
        autoFocus
        className="min-w-48 flex-1 rounded border border-slate-300 p-1 text-sm"
      />
      <button onClick={save} disabled={!draft.destination.trim() || update.isPending} className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">
        {update.isPending ? 'Saving…' : 'Save'}
      </button>
      <button onClick={() => setEditing(false)} className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-300">Cancel</button>
    </li>
  )
}

function NotesEditor({ applicationId, notes }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(notes ?? '')
  const update = useUpdateApplication()

  if (!editing) {
    return (
      <Section title="Notes">
        <div className="flex items-start justify-between gap-3">
          <p className="whitespace-pre-line text-sm text-slate-600">{notes || <span className="italic text-slate-400">No notes yet.</span>}</p>
          <button
            onClick={() => { setDraft(notes ?? ''); setEditing(true) }}
            className="shrink-0 rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
          >
            Edit
          </button>
        </div>
      </Section>
    )
  }

  const save = () => {
    update.mutate(
      { id: applicationId, notes: draft.trim() || null },
      { onSuccess: () => setEditing(false) }
    )
  }

  return (
    <Section title="Notes">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        autoFocus
        className="w-full rounded border border-slate-300 p-2 text-sm"
      />
      <div className="mt-2 flex gap-2">
        <button onClick={save} disabled={update.isPending} className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {update.isPending ? 'Saving…' : 'Save'}
        </button>
        <button onClick={() => setEditing(false)} className="rounded bg-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-300">Cancel</button>
      </div>
    </Section>
  )
}

function Section({ title, children }) {
  return (
    <section className="rounded-lg bg-white p-4 shadow">
      <h2 className="mb-2 font-semibold text-slate-700">{title}</h2>
      {children}
    </section>
  )
}

function EditActions({ onSave, onCancel, saving }) {
  return (
    <div className="flex gap-2">
      <button onClick={onSave} disabled={saving} className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">
        {saving ? 'Saving…' : 'Save'}
      </button>
      <button onClick={onCancel} className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-300">Cancel</button>
    </div>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-0.5 text-xs text-slate-500 ${className}`}>
      {label}
      {children}
    </label>
  )
}

const inputCls = 'w-full rounded border border-slate-300 p-1 text-sm text-slate-800'
const emptyToNull = (v) => (v === '' ? null : v)

function AssessmentItem({ assessment }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(null)
  const update = useUpdateAssessment()

  const open = () => {
    setDraft({
      type: assessment.type,
      name: assessment.name ?? '',
      status: assessment.status,
      location: assessment.location ?? '',
      scheduled_at: toInputDateTime(assessment.scheduled_at),
      completed_at: toInputDateTime(assessment.completed_at),
      score: assessment.score ?? '',
      max_score: assessment.max_score ?? '',
      result_notes: assessment.result_notes ?? '',
    })
    setEditing(true)
  }

  if (!editing) {
    return (
      <li className="flex items-center justify-between gap-3 py-1.5">
        <div>
          <span className="font-medium uppercase">{assessment.type}</span>
          {assessment.name && ` — ${assessment.name}`}
          <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs">{assessment.status}</span>
          {assessment.score != null && <span className="text-xs text-slate-500"> · {assessment.score}{assessment.max_score != null && `/${assessment.max_score}`}</span>}
          {assessment.scheduled_at && <span className="text-xs text-slate-400"> · {formatDateTime(assessment.scheduled_at)}</span>}
        </div>
        <button onClick={open} className="shrink-0 rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100">Edit</button>
      </li>
    )
  }

  const set = (k) => (e) => setDraft({ ...draft, [k]: e.target.value })
  const save = () => {
    update.mutate(
      {
        id: assessment.id,
        type: draft.type,
        name: emptyToNull(draft.name),
        status: draft.status,
        location: emptyToNull(draft.location),
        scheduled_at: fromInputDateTime(draft.scheduled_at),
        completed_at: fromInputDateTime(draft.completed_at),
        score: draft.score === '' ? null : Number(draft.score),
        max_score: draft.max_score === '' ? null : Number(draft.max_score),
        result_notes: emptyToNull(draft.result_notes),
      },
      { onSuccess: () => setEditing(false) }
    )
  }

  return (
    <li className="space-y-2 py-1.5">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        <Field label="Type">
          <select value={draft.type} onChange={set('type')} className={inputCls}>
            {ASSESSMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select value={draft.status} onChange={set('status')} className={inputCls}>
            {ASSESSMENT_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </Field>
        <Field label="Name"><input value={draft.name} onChange={set('name')} className={inputCls} /></Field>
        <Field label="Scheduled"><input type="datetime-local" value={draft.scheduled_at} onChange={set('scheduled_at')} className={inputCls} /></Field>
        <Field label="Completed"><input type="datetime-local" value={draft.completed_at} onChange={set('completed_at')} className={inputCls} /></Field>
        <Field label="Location"><input value={draft.location} onChange={set('location')} className={inputCls} /></Field>
        <Field label="Score"><input type="number" step="0.01" min="0" value={draft.score} onChange={set('score')} className={inputCls} /></Field>
        <Field label="Max score"><input type="number" step="0.01" min="0" value={draft.max_score} onChange={set('max_score')} className={inputCls} /></Field>
        <Field label="Result notes" className="col-span-2 lg:col-span-3"><input value={draft.result_notes} onChange={set('result_notes')} className={inputCls} /></Field>
      </div>
      <EditActions onSave={save} onCancel={() => setEditing(false)} saving={update.isPending} />
    </li>
  )
}

function CommunicationItem({ communication }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(null)
  const update = useUpdateCommunication()

  const open = () => {
    setDraft({
      method: communication.method,
      direction: communication.direction,
      summary: communication.summary,
      details: communication.details ?? '',
      occurred_at: toInputDateTime(communication.occurred_at),
      follow_up_due_at: toInputDateTime(communication.follow_up_due_at),
    })
    setEditing(true)
  }

  if (!editing) {
    return (
      <li className="flex items-center justify-between gap-3 py-1.5">
        <div>
          <span className="font-medium capitalize">{communication.method}</span> ({communication.direction}) — {communication.summary}
          <span className="text-xs text-slate-400"> · {formatDateTime(communication.occurred_at)}</span>
          {communication.follow_up_due_at && !communication.follow_up_completed_at && (
            <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">follow-up {formatDateTime(communication.follow_up_due_at)}</span>
          )}
          {communication.follow_up_completed_at && <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">done</span>}
        </div>
        <button onClick={open} className="shrink-0 rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100">Edit</button>
      </li>
    )
  }

  const set = (k) => (e) => setDraft({ ...draft, [k]: e.target.value })
  const save = () => {
    update.mutate(
      {
        id: communication.id,
        method: draft.method,
        direction: draft.direction,
        summary: draft.summary.trim(),
        details: emptyToNull(draft.details),
        occurred_at: fromInputDateTime(draft.occurred_at),
        follow_up_due_at: fromInputDateTime(draft.follow_up_due_at),
      },
      { onSuccess: () => setEditing(false) }
    )
  }

  return (
    <li className="space-y-2 py-1.5">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        <Field label="Method">
          <select value={draft.method} onChange={set('method')} className={inputCls}>
            {COMM_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </Field>
        <Field label="Direction">
          <select value={draft.direction} onChange={set('direction')} className={inputCls}>
            <option value="outbound">Outbound</option>
            <option value="inbound">Inbound</option>
          </select>
        </Field>
        <Field label="Occurred">
          <input type="datetime-local" value={draft.occurred_at} onChange={set('occurred_at')} className={inputCls} />
        </Field>
        <Field label="Summary" className="col-span-2 lg:col-span-3">
          <input required value={draft.summary} onChange={set('summary')} className={inputCls} />
        </Field>
        <Field label="Follow-up due (empty = none)">
          <input type="datetime-local" value={draft.follow_up_due_at} onChange={set('follow_up_due_at')} className={inputCls} />
        </Field>
        <Field label="Details" className="col-span-2 lg:col-span-3">
          <textarea rows={2} value={draft.details} onChange={set('details')} className={inputCls} />
        </Field>
      </div>
      <EditActions
        onSave={save}
        onCancel={() => setEditing(false)}
        saving={update.isPending}
      />
    </li>
  )
}

export default function ApplicationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: app, isLoading } = useApplication(id)
  const changeStatus = useChangeStatus()
  const deleteApp = useDeleteApplication()

  if (isLoading) return <p className="text-slate-500">Loading…</p>
  if (!app) return <p className="text-red-600">Application not found.</p>

  const handleDelete = () => {
    if (!confirmDeleteApplication(app)) return
    deleteApp.mutate(app.id, { onSuccess: () => navigate('/applications') })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{app.job_title}</h1>
          <p className="text-sm text-slate-500">
            <Link to={`/companies/${app.company_id}`} className="text-blue-700 hover:underline">{app.company_name}</Link>
            {app.branch_label && ` — ${app.branch_label}`} · {ROLE_LABELS[app.role_category]} · Priority: {PRIORITY_LABELS[app.priority]} · Applied {formatDate(app.applied_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[app.status]}`}>{STATUS_LABELS[app.status]}</span>
          <select
            className="rounded border border-slate-300 bg-white p-1 text-sm"
            value={app.status}
            onChange={(e) => changeStatus.mutate({ id: app.id, status: e.target.value })}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <button
            onClick={handleDelete}
            disabled={deleteApp.isPending}
            className="rounded border border-red-300 bg-red-50 px-2.5 py-1 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            {deleteApp.isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      <NotesEditor applicationId={app.id} notes={app.notes} />

      <Section title={`Submissions (${app.submissions.length})`}>
        {app.submissions.length === 0 ? <p className="text-sm text-slate-400">None logged.</p> : (
          <ul className="divide-y text-sm">
            {app.submissions.map((s) => <SubmissionItem key={s.id} submission={s} />)}
          </ul>
        )}
      </Section>

      <Section title={`Assessments (${app.assessments.length})`}>
        {app.assessments.length === 0 ? <p className="text-sm text-slate-400">None logged.</p> : (
          <ul className="divide-y text-sm">
            {app.assessments.map((a) => <AssessmentItem key={a.id} assessment={a} />)}
          </ul>
        )}
      </Section>

      <Section title={`Communications (${app.communications.length})`}>
        {app.communications.length === 0 ? <p className="text-sm text-slate-400">None logged.</p> : (
          <ul className="divide-y text-sm">
            {app.communications.map((c) => <CommunicationItem key={c.id} communication={c} />)}
          </ul>
        )}
      </Section>

      <Section title="Status history">
        <ol className="space-y-1 text-sm">
          {app.history.map((h) => (
            <li key={h.id} className="text-slate-600">
              <span className="text-xs text-slate-400">{formatDateTime(h.changed_at)}</span>{' '}
              {h.old_status ? `${STATUS_LABELS[h.old_status]} → ` : ''}<b>{STATUS_LABELS[h.new_status]}</b>
              {h.note && <span className="text-slate-400"> — {h.note}</span>}
            </li>
          ))}
        </ol>
      </Section>
    </div>
  )
}
