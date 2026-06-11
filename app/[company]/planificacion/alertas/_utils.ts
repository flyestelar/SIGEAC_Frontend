import { PlanificationAlertResource } from '@api/types';

export function formatRemainingValue(alert: PlanificationAlertResource) {
  if (alert.earliest_due_metric === 'CALENDAR') {
    return `${alert.metrics.calendar.remaining_days} días`;
  }
  const metric = alert.earliest_due_metric === 'FH' ? alert.metrics.flight_hours : alert.metrics.flight_cycles;
  return `${metric.remaining?.toFixed(2)} ${alert.earliest_due_metric}`;
}
