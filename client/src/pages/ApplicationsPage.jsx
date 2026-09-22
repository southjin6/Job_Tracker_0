import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApplications, useCompanies, useCreateApplication, useCreateSubmission, useDeleteApplication } from '../api/hooks.js'
import { STATUSES, STATUS_LABELS, STATUS_COLORS, SUBMISSION_CHANNELS, formatDate, todayLocalDate, confirmDeleteApplication } from '../lib/statuses.js'

function NewApplicationForm({ onClose }) {
  const { data: companies = [] } = useCompanies()
  const create = useCreateApplication()
  const createSubmission = useCreateSubmission()
  const [form, setForm] = useState({
    company_id: '',
    job_title: '',
    role_category: 'it',
    applied_at: todayLocalDate(),
    source: '',
    notes: '',
    channel: 'email',
    destination: '',
  })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    try {
      const app = await create.mutateAsync({
        ...form,
        company_id: Number(form.company_id),
        source: form.source || null,
        notes: form.notes || null,
      })
      if (form.destination.trim()) {
        await createSubmission.mutateAsync({
          appId: app.id,
          channel: form.channel,
          destination: form.destination.trim(),
        })
      }
      onClose()
    } catch {
      // global error toast already shown; keep the form open so the entry isn't lost
    }
  }

  return (
    <form onSubmit={submit} className="mb-4 space-y-2 rounded-lg bg-white p-4 shadow">
      <h2 className="font-semibold text-slate-700">New application</h2>
      <div className="grid gap-2 md:grid-cols-2">
        <select required value={form.company_id} onChange={set('company_id')} className="rounded border border-slate-300 p-1.5 text-sm">
          <option value="">Select company…</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input required placeholder="Job title" value={form.job_title} onChange={set('job_title')} className="rounded border border-slate-300 p-1.5 text-sm" />
        <select value={form.role_category} onChange={set('role_category')} className="rounded border border-slate-300 p-1.5 text-sm">
          <option value="it">IT</option>
          <option value="service_desk">Service Desk</option>
          <option value="data">Data</option>
          <option value="other">Other</option>
        </select>
        <input type="date" value={form.applied_at} onChange={set('applied_at')} className="rounded border border-slate-300 p-1.5 text-sm" />
        <input placeholder="Source (where you found it: JobStreet, walk-in…)" value={form.source} onChange={set('source')} className="rounded border border-slate-300 p-1.5 text-sm" />
        <input placeholder="Notes (optional)" value={form.notes} onChange={set('notes')} className="rounded border border-slate-300 p-1.5 text-sm" />
      </div>
      <div className="flex gap-2">
        <select value={form.channel} onChange={set('channel')} className="rounded border border-slate-300 p-1.5 text-sm">
          {SUBMISSION_CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input
          placeholder="Submitted to: email / portal URL / location (optional)"
          value={form.destination}
          onChange={set('destination')}
          className="flex-1 rounded border border-slate-300 p-1.5 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={create.isPending || createSubmission.isPending} className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {create.isPending ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onClose} className="rounded bg-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-300">Cancel</button>
      </div>
    </form>
  )
}

export default function ApplicationsPage() {
  const [filters, setFilters] = useState({ status: '', q: '', sort: 'recent' })
  const [showForm, setShowForm] = useState(false)
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  const { data: applications = [], isLoading } = useApplications(params)
  const deleteApp = useDeleteApplication()

  const handleDelete = (app) => {
    if (!confirmDeleteApplication(app)) return
    deleteApp.mutate(app.id)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-slate-800">Applications</h1>
        <button onClick={() => setShowForm(true)} className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
          + New application
        </button>
      </div>

      {showForm && <NewApplicationForm onClose={() => setShowForm(false)} />}

      <div className="mb-3 flex flex-wrap gap-2">
        <input
          placeholder="Search job title or company…"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          className="w-64 rounded border border-slate-300 p-1.5 text-sm"
        />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="rounded border border-slate-300 p-1.5 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })} className="rounded border border-slate-300 p-1.5 text-sm">
          <option value="recent">Newest first</option>
          <option value="priority">Priority</option>
          <option value="status_changed">Recently changed</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Job title</th>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Applied</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {applications.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <Link to={`/applications/${a.id}`} className="font-medium text-blue-700 hover:underline">{a.job_title}</Link>
                  </td>
                  <td className="px-3 py-2">
                    <Link to={`/companies/${a.company_id}`} className="text-slate-600 hover:underline">{a.company_name}</Link>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status]}`}>{STATUS_LABELS[a.status]}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{formatDate(a.applied_at)}</td>
                  <td className="px-3 py-2 text-slate-500">{a.source ?? '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => handleDelete(a)}
                      disabled={deleteApp.isPending}
                      className="rounded px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      title="Delete application"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-400">No applications yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
