import { Link } from 'react-router-dom'
import { usePipeline, useChangeStatus } from '../api/hooks.js'
import { STATUSES, STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, formatDate } from '../lib/statuses.js'

export default function PipelinePage() {
  const { data: pipeline, isLoading } = usePipeline()
  const changeStatus = useChangeStatus()

  if (isLoading) return <p className="text-slate-500">Loading…</p>
  if (!pipeline) return <p className="text-red-600">Could not load pipeline.</p>

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-800">Pipeline</h1>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STATUSES.map((status) => (
          <div key={status} className="w-64 shrink-0 rounded-lg bg-slate-200/70 p-2">
            <div className={`mb-2 rounded px-2 py-1 text-center text-sm font-semibold ${STATUS_COLORS[status]}`}>
              {STATUS_LABELS[status]} ({(pipeline[status] ?? []).length})
            </div>
            <div className="space-y-2">
              {(pipeline[status] ?? []).map((app) => (
                <div key={app.id} className="rounded-md bg-white p-2 shadow-sm">
                  <Link to={`/applications/${app.id}`} className="block text-sm font-medium text-blue-700 hover:underline">
                    {app.job_title}
                  </Link>
                  <div className="text-xs text-slate-600">{app.company_name}</div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                    <span>{PRIORITY_LABELS[app.priority]} · {formatDate(app.applied_at)}</span>
                    <select
                      className="rounded border border-slate-300 bg-white text-xs"
                      value={status}
                      onChange={(e) => changeStatus.mutate({ id: app.id, status: e.target.value })}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400">Drag-and-drop arrives in phase 10 — use the status dropdown for now.</p>
    </div>
  )
}
