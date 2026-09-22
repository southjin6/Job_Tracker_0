import { useEffect, useState } from 'react'

let nextId = 1
const toasts = []
const listeners = new Set()

function notify() {
  for (const l of listeners) l([...toasts])
}

export function errorMessage(err) {
  return err?.response?.data?.error?.message ?? err?.message ?? 'Request failed'
}

export function pushError(err) {
  const message = errorMessage(err)
  if (toasts.some((t) => t.message === message)) return
  const toast = { id: nextId++, message }
  toasts.push(toast)
  if (toasts.length > 5) toasts.shift()
  notify()
  setTimeout(() => dismissError(toast.id), 8000)
}

export function dismissError(id) {
  const i = toasts.findIndex((t) => t.id === id)
  if (i !== -1) toasts.splice(i, 1)
  notify()
}

export function useErrorToasts() {
  const [items, setItems] = useState(() => [...toasts])
  useEffect(() => {
    listeners.add(setItems)
    return () => listeners.delete(setItems)
  }, [])
  return items
}
