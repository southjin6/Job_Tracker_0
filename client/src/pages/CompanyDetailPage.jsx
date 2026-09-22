import { Link, useParams } from 'react-router-dom'
import { useCompany } from '../api/hooks.js'
import { STATUS_LABELS, STATUS_COLORS, formatDate } from '../lib/statuses.js'

function Section({ title, children }) {
  return (
    <section className="rounded-lg bg-white p-4 shadow">
      <h2 className="mb-2 font-semibold text-slate-700">{title}</h2>
      {children}
    </section>
  )
}

export default function CompanyDetailPage() {
  const { id } = useParams()
  const { data: company, isLoading } = useCompany(id)

  if (isLoading) return <p className="text-slate-500">Loading…</p>
  if (!company) return <p className="text-red-600">Company not found.</p>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{company.name}</h1>
        <p className="text-sm text-slate-500">
          {[company.industry, company.company_size && `${company.company_size} people`, company.website].filter(Boolean).join(' · ') || '—'}
        </p>
      </div>

      {company.notes && <Section title="Notes"><p className="text-sm text-slate-600">{company.notes}</p></Section>}

      <Section title={`Branches (${company.branches.length})`}>
        {company.branches.length === 0 ? <p className="text-sm text-slate-400">None.</p> : (
          <ul className="divide-y text-sm">
            {company.branches.map((b) => (
              <li key={b.id} className="py-1.5">
                <b>{b.label}</b>{b.is_primary ? ' ★' : ''}
                <div className="text-slate-500">{[b.address_line, b.city, b.province, b.region].filter(Boolean).join(', ') || '—'}</div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Contacts (${company.contacts.length})`}>
        {company.contacts.length === 0 ? <p className="text-sm text-slate-400">None.</p> : (
          <ul className="divide-y text-sm">
            {company.contacts.map((c) => (
              <li key={c.id} className="py-1.5">
                <b>{c.full_name}</b>{c.is_primary ? ' ★' : ''}{c.job_title && <span className="text-slate-500"> — {c.job_title}</span>}
                <div className="text-slate-500">{[c.email, c.phone].filter(Boolean).join(' · ') || '—'}</div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Applications (${company.applications.length})`}>
        {company.applications.length === 0 ? <p className="text-sm text-slate-400">None.</p> : (
          <ul className="divide-y text-sm">
            {company.applications.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-1.5">
                <Link to={`/applications/${a.id}`} className="font-medium text-blue-700 hover:underline">{a.job_title}</Link>
                <span className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status]}`}>{STATUS_LABELS[a.status]}</span>
                  <span className="text-xs text-slate-400">{formatDate(a.applied_at)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}
