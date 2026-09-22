import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryCache, MutationCache, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import { pushError } from './lib/errorToast'

const queryClient = new QueryClient({
  // Global safety net: every query/mutation error surfaces as a toast.
  queryCache: new QueryCache({ onError: pushError }),
  mutationCache: new MutationCache({ onError: pushError }),
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: true, staleTime: 15_000 },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
