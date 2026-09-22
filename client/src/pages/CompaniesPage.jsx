import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCompanies, useCreateCompany } from '../api/hooks.js'

export default function CompaniesPage() {
  const [q, setQ] = useState('')
  const [name, setName] = useState('')
  const { data: companies = [], isLoading } = useCompanies(q)
  const create = useCreateCompany()

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    create.mutate({ name: name.trim() }, { onSuccess: () => setName('') })
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-800">Companies</h1>

      <form onSubmit={submit} className="mb-4 flex gap-2">
        <input
          placeholder="Quick-add company name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-72 rounded border border-slate-300 p-1.5 text-sm"
        />
        <button type="submit" disabled={create.isPending} className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          Add
        </button>
      </form>

      <input
        placeholder="Search…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-3 w-72 rounded border border-slate-300 p-1.5 text-sm"
      />

      {isLoading ? <p className="text-slate-500">Loading…</p> : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <Link key={c.id} to={`/companies/${c.id}`} className="rounded-lg bg-white p-4 shadow hover:shadow-md">
              <div className="font-semibold text-slate-800">{c.name}</div>
              <div className="text-sm text-slate-500">{c.industry ?? '—'}</div>
              <div className="mt-1 text-xs text-slate-400">{c.application_count} application{c.application_count === 1 ? '' : 's'}</div>
            </Link>
          ))}
          {companies.length === 0 && <p className="text-slate-400">No companies found.</p>}
        </div>
      )}
    </div>
  )
}
