import { Routes, Route, NavLink } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage.jsx'
import PipelinePage from './pages/PipelinePage.jsx'
import ApplicationsPage from './pages/ApplicationsPage.jsx'
import ApplicationDetailPage from './pages/ApplicationDetailPage.jsx'
import CompaniesPage from './pages/CompaniesPage.jsx'
import CompanyDetailPage from './pages/CompanyDetailPage.jsx'
import { useFollowUpsDue } from './api/hooks.js'
import { useErrorToasts, dismissError } from './lib/errorToast'

const navClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`

function ErrorToasts() {
  const toasts = useErrorToasts()
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="flex items-start justify-between gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 shadow-lg">
          <span className="break-words">{t.message}</span>
          <button onClick={() => dismissError(t.id)} className="shrink-0 font-bold text-red-400 hover:text-red-700" aria-label="Dismiss">
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

function FollowUpBadge() {
  const { data } = useFollowUpsDue()
  if (!data?.length) return null
  return (
    <span className="ml-1.5 inline-flex items-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
      {data.length}
    </span>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-slate-800">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2">
          <span className="mr-4 text-lg font-bold text-white">Job Tracker</span>
          <NavLink to="/" end className={navClass}>Dashboard</NavLink>
          <NavLink to="/pipeline" className={navClass}>Pipeline</NavLink>
          <NavLink to="/applications" className={navClass}>Applications</NavLink>
          <NavLink to="/companies" className={navClass}>Companies</NavLink>
          <NavLink to="/follow-ups" className={navClass}>
            Follow-ups<FollowUpBadge />
          </NavLink>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/applications/:id" element={<ApplicationDetailPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/companies/:id" element={<CompanyDetailPage />} />
          <Route path="/follow-ups" element={<DashboardPage showFollowUpsOnly />} />
        </Routes>
      </main>
      <ErrorToasts />
    </div>
  )
}
