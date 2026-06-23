import { AircraftAverageMetric, MaintenanceControlResource } from '@api/types';
import { addDays } from 'date-fns';
import { minBy } from 'es-toolkit';
import { ALL_METRIC_TYPES, INTERVAL_KEYS, SINCE_LAST_KEYS } from '../_components/control-grid-shared';
import { AlertLevel, MetricEstimation, MetricType } from './types';

export const LEVEL_PRIORITY: Record<AlertLevel, number> = { OVERDUE: 0, WARNING: 1, OK: 2 };

export type ComputedMetric = {
  type: MetricType;
  consumed: number;
  interval: number;
  remaining: number;
  percentage: number;
  status: AlertLevel;
};

export function computeMetrics(control: MaintenanceControlResource): ComputedMetric[] {
  const metrics: ComputedMetric[] = [];
  if (!control.consumed) return metrics;

  for (const type of ALL_METRIC_TYPES) {
    const interval = control[INTERVAL_KEYS[type]];
    if (interval === null || interval === undefined || interval === 0) continue;

    const consumed = control.consumed[SINCE_LAST_KEYS[type]];
    const remaining = interval - consumed;
    const percentage = Math.min((consumed / interval) * 100, 100);

    let status: AlertLevel = 'OK';
    if (percentage >= 100) status = 'OVERDUE';
    else if (percentage >= 70) status = 'WARNING';

    metrics.push({ type, consumed, interval, remaining, percentage, status });
  }

  return metrics;
}

export function computeMetricEstimation(
  metric: ComputedMetric,
  averages: AircraftAverageMetric | null,
): MetricEstimation {
  const averageHrs = averages?.average_daily_flight_hours;
  const averageFc = averages?.average_daily_flight_cycles;
  // if (metric.remaining <= 0) {
  //   const avg = metric.type === 'FH' ? averageHrs : metric.type === 'FC' ? averageFc : undefined;
  //   return { date: new Date(), days: 0, avg };
  // }
  let days: number | null = null;
  let avg: number | undefined;

  if (metric.type === 'DAYS') {
    days = metric.remaining;
  } else if (metric.type === 'FH' && averageHrs && averageHrs > 0) {
    days = metric.remaining / averageHrs;
    avg = averageHrs;
  } else if (metric.type === 'FC' && averageFc && averageFc > 0) {
    days = metric.remaining / averageFc;
    avg = averageFc;
  }

  if (days === null || !Number.isFinite(days)) return null;
  return { date: addDays(new Date(), Math.ceil(days)), days, avg };
}

export function worstStatus(metrics: ComputedMetric[]): AlertLevel {
  return minBy(metrics, (m) => LEVEL_PRIORITY[m.status])?.status ?? 'OK';
}
