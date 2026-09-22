import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';

const invalidate = (qc, keys) => keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));

// ---------- dashboard ----------
export function useDashboardStats() {
  return useQuery({ queryKey: ['dashboard', 'stats'], queryFn: () => api.get('/dashboard/stats').then((r) => r.data) });
}

export function usePipeline() {
  return useQuery({ queryKey: ['dashboard', 'pipeline'], queryFn: () => api.get('/dashboard/pipeline').then((r) => r.data) });
}

export function useFollowUpsDue() {
  return useQuery({ queryKey: ['follow-ups'], queryFn: () => api.get('/follow-ups/due').then((r) => r.data) });
}

// ---------- companies ----------
// 'list'/'detail' prefixes keep search keys like ['companies','list','3'] from
// colliding with detail keys built from a string route param.
export function useCompanies(q = '') {
  return useQuery({
    queryKey: ['companies', 'list', q],
    queryFn: () => api.get('/companies', { params: q ? { q } : {} }).then((r) => r.data),
  });
}

export function useCompany(id) {
  return useQuery({
    queryKey: ['companies', 'detail', id],
    queryFn: () => api.get(`/companies/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/companies', data).then((r) => r.data),
    onSuccess: () => invalidate(qc, [['companies']]),
  });
}

// ---------- applications ----------
export function useApplications(filters = {}) {
  return useQuery({
    queryKey: ['applications', filters],
    queryFn: () => api.get('/applications', { params: filters }).then((r) => r.data),
  });
}

export function useApplication(id) {
  return useQuery({
    queryKey: ['applications', 'detail', id],
    queryFn: () => api.get(`/applications/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

const APP_KEYS = [['applications'], ['dashboard']];

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/applications', data).then((r) => r.data),
    onSuccess: () => invalidate(qc, APP_KEYS),
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/applications/${id}`, data).then((r) => r.data),
    onSuccess: (app) => {
      invalidate(qc, APP_KEYS);
      qc.invalidateQueries({ queryKey: ['applications', 'detail', app.id] });
    },
  });
}

export function useCreateSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ appId, ...data }) => api.post(`/applications/${appId}/submissions`, data).then((r) => r.data),
    onSuccess: (_d, vars) => invalidate(qc, [...APP_KEYS, [['applications', 'detail', vars.appId]]]),
  });
}

export function useUpdateSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/submissions/${id}`, data).then((r) => r.data),
    onSuccess: (s) => invalidate(qc, [...APP_KEYS, [['applications', 'detail', s.application_id]]]),
  });
}

export function useUpdateAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/assessments/${id}`, data).then((r) => r.data),
    onSuccess: (a) => invalidate(qc, [...APP_KEYS, [['applications', 'detail', a.application_id]]]),
  });
}

export function useUpdateCommunication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/communications/${id}`, data).then((r) => r.data),
    onSuccess: (c) => invalidate(qc, [...APP_KEYS, [['applications', 'detail', c.application_id]]]),
  });
}

export function useChangeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }) => api.patch(`/applications/${id}/status`, { status, note }).then((r) => r.data),
    onSuccess: () => invalidate(qc, APP_KEYS),
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/applications/${id}`),
    onSuccess: () => invalidate(qc, [...APP_KEYS, ['companies']]),
  });
}

// ---------- follow-ups ----------
export function useFollowUpAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, due_at }) => api.patch(`/communications/${id}/follow-up`, { action, due_at }).then((r) => r.data),
    onSuccess: () => invalidate(qc, [...APP_KEYS, ['follow-ups']]),
  });
}
