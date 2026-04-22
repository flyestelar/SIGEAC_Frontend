import {
  Aircraft,
  AircraftComponentSlotResource,
  AircraftResource,
  HardTimeComplianceResource,
  HardTimeInstallationResource,
  HardTimeIntervalResource,
} from '@api/types';
import { differenceInDays } from 'date-fns';
import { round, maxBy } from 'lodash-es';

type Status = 'OK' | 'WARNING' | 'OVERDUE' | null;

function toNumber(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

export function getAircraftComponentSlotMetrics(data: AircraftComponentSlotResource, aircraft: AircraftResource) {
  const activeInstallation = data.active_installation;

  if (!activeInstallation) {
    return null;
  }

  // compute current component hours/cycles
  const installCompHours = activeInstallation.component_hours_at_install;
  const installAircraftHoursAtInstall = activeInstallation.aircraft_hours_at_install;
  const aircraftFlightHours = aircraft.flight_hours;

  const component_hours_current = round(installCompHours + (aircraftFlightHours - installAircraftHoursAtInstall), 2);

  const installCompCycles = activeInstallation.component_cycles_at_install ?? 0;
  const installAircraftCyclesAtInstall = toNumber(activeInstallation.aircraft_cycles_at_install);
  const aircraftFlightCycles = toNumber(aircraft.flight_cycles);

  const component_cycles_current = installCompCycles + (aircraftFlightCycles - installAircraftCyclesAtInstall);

  // evaluate each interval and compute overall worst status
  let worstStatus: Status = 'OK';

  const intervals = data.installed_part?.intervals ?? [];
  for (const interval of intervals) {
    if (!interval || interval.is_active === false) continue;
    const intervalMetrics = getIntervalMetrics(interval, aircraft, activeInstallation);
    const intervalStatus = intervalMetrics.status ?? 'OK';

    worstStatus = maxBy([worstStatus, intervalStatus], statusSeverityOrder)!;
  }

  return { computed_status: worstStatus, component_hours_current, component_cycles_current };
}

function statusSeverityOrder(status: Status) {
  switch (status) {
    case 'OK':
      return 1;
    case 'OVERDUE':
      return 2;
    case 'WARNING':
      return 3;
    default:
      return 0;
  }
}

// -----------------------------------------------

/**
 * Compute metrics for this interval given aircraft state and active installation.
 * Populates $this.metrics with an array of metric objects and sets $this.status.
 */
function getIntervalMetrics(
  interval: HardTimeIntervalResource,
  aircraft: AircraftResource,
  installation: HardTimeInstallationResource,
) {
  const lastCompliance = interval.last_compliance;
  const today = new Date();
  const metrics = [];

  let consumed: number;

  if (interval.interval_hours !== null) {
    if (lastCompliance) {
      consumed = Math.max(0, aircraft.flight_hours - lastCompliance.aircraft_hours_at_compliance);
    } else {
      consumed =
        installation.component_hours_at_install + (aircraft.flight_hours - installation.aircraft_hours_at_install);
    }
    metrics.push(buildIntervalMetric('FH', consumed, interval.interval_hours));
  }

  if (interval.interval_cycles !== null) {
    if (lastCompliance) {
      consumed = Math.max(0, aircraft.flight_cycles - lastCompliance.aircraft_cycles_at_compliance);
    } else {
      consumed =
        installation.component_cycles_at_install + (aircraft.flight_cycles - installation.aircraft_cycles_at_install);
    }
    metrics.push(buildIntervalMetric('FC', consumed, interval.interval_cycles));
  }

  if (interval.interval_days !== null) {
    if (lastCompliance) {
      consumed = Math.max(0, differenceInDays(today, new Date(lastCompliance.compliance_date)));
    } else {
      consumed = Math.max(0, differenceInDays(today, new Date(installation.installed_at)));
    }
    metrics.push(buildIntervalMetric('DAYS', consumed, interval.interval_days));
  }

  const status = resolveWorstStatus(metrics);

  return { metrics, status };
}

function buildIntervalMetric(type: string, consumed: number, interval: number) {
  return {
    type: type,
    consumed: consumed,
    interval: interval,
    remaining: Math.max(0, interval - consumed),
    percentage: interval > 0 ? round((consumed / interval) * 100, 2) : 0,
    status: resolveStatus(interval > 0 ? round((consumed / interval) * 100, 2) : 0),
  };
}

function resolveStatus($percentage: number): string {
  if ($percentage >= 100) {
    return 'OVERDUE';
  }
  if ($percentage >= 80) {
    return 'WARNING';
  }
  return 'OK';
}

interface Metric {
  type: string;
  consumed: number;
  interval: number;
  remaining: number;
  percentage: number;
  status: Status;
}

function resolveWorstStatus(metrics: Metric[]): Status {
  return maxBy(metrics, (m) => statusSeverityOrder(m.status))?.status ?? 'OK';
}
