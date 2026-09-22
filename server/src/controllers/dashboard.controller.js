import * as dashboardService from '../services/dashboard.service.js';

export async function stats(req, res) {
  res.json(await dashboardService.getStats());
}

export async function pipeline(req, res) {
  res.json(await dashboardService.getPipeline());
}
