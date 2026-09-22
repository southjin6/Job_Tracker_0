import { Link } from 'react-router-dom'
import { useDashboardStats, useFollowUpsDue, useFollowUpAction } from '../api/hooks.js'
import { STATUS_LABELS, STATUS_COLORS, formatDateTime } from '../lib/statuses.js'

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  )
}

export default function DashboardPage({ showFollowUpsOnly = false }) {
  const { data: stats, isLoading } = useDashboardStats()
  const { data: followUps = [] } = useFollowUpsDue()
  const followUpAction = useFollowUpAction()

  if (isLoading) return <p className="text-slate-500">Loading…</p>
  if (!stats) return <p className="text-red-600">Could not load dashboard. Is the API running?</p>

  const counts = Object.fromEntries(stats.by_status.map((r) => [r.status, r.count]))

  return (
    <div className="space-y-6">
      {!showFollowUpsOnly && (
        <>
          <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Total applications" value={stats.total_applications} />
            <StatCard label="Applied (last 7 days)" value={stats.applied_last_7_days} />
            <StatCard label="Follow-ups due" value={stats.follow_ups_due.length} />
            <StatCard label="Stale (>14 days, active)" value={stats.stale_applications} />
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <div key={key} className={`rounded-md px-3 py-2 text-center text-sm font-medium ${STATUS_COLORS[key]}`}>
                {label}: {counts[key] ?? 0}
              </div>
            ))}
          </div>

          {stats.upcoming_assessments.length > 0 && (
            <section className="rounded-lg bg-white p-4 shadow">
              <h2 className="mb-2 font-semibold text-slate-700">Upcoming assessments</h2>
              <ul className="divide-y">
                {stats.upcoming_assessments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                    <Link to={`/applications/${a.application_id}`} className="text-blue-700 hover:underline">
                      {a.name || a.type} — {a.company_name} ({a.job_title})
                    </Link>
                    <span className="text-slate-500">{formatDateTime(a.scheduled_at)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <section className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold text-slate-700">
          {showFollowUpsOnly ? 'Follow-ups due' : 'Follow-ups due now'}
        </h2>
        {followUps.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing due. 🎉</p>
        ) : (
          <ul className="divide-y">
            {followUps.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                <div>
                  <Link to={`/applications/${f.application_id}`} className="font-medium text-blue-700 hover:underline">
                    {f.company_name} — {f.job_title}
                  </Link>
                  <div className="text-slate-600">{f.summary}</div>
                  <div className="text-xs text-red-600">Due {formatDateTime(f.follow_up_due_at)}</div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                    onClick={() => followUpAction.mutate({ id: f.id, action: 'complete' })}
                  >
                    Done
                  </button>
                  <button
                    className="rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300"
                    onClick={() => {
                      const tomorrow = new Date(Date.now() + 86_400_000)
                      const due = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60_000).toISOString().slice(0, 19)
                      followUpAction.mutate({ id: f.id, action: 'snooze', due_at: due })
                    }}
                  >
                    Snooze 1d
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
