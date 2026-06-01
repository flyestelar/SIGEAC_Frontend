import { planificationAlertsIndex } from '@api/sdk.gen';
import { useQuery } from '@tanstack/react-query';

export type PlanificationAlertStatus = 'OK' | 'WARNING' | 'OVERDUE';
export type PlanificationAlertItemType = 'maintenance_control' | 'hard_time' | 'directive';
export type PlanificationAlertMetric = 'CALENDAR' | 'FH' | 'FC';
export type PlanificationAlertRemainingUnit = 'days' | 'flight_hours' | 'flight_cycles';

export interface PlanificationAlertAircraft {
  id: number;
  acronym: string | null;
  model: string | null;
  serial: string | null;
}

export interface PlanificationAlert {
  status: PlanificationAlertStatus;
  item_type: PlanificationAlertItemType;
  item_identifier: string;
  description: string | null;
  aircraft: PlanificationAlertAircraft;
  governing_metric: PlanificationAlertMetric;
  governing_date: string;
  remaining_value: number | null;
  remaining_unit: PlanificationAlertRemainingUnit | null;
  projected_date: string | null;
  source: Record<string, number | string | null>;
}

export interface PlanificationAlertsSummary {
  OK: number;
  WARNING: number;
  OVERDUE: number;
  total: number;
}

export interface PlanificationAlertsResponse {
  alerts: PlanificationAlert[];
  summary: PlanificationAlertsSummary;
}

export interface PlanificationAlertsFilters {
  aircraft_id?: number;
  item_type?: PlanificationAlertItemType;
  status?: PlanificationAlertStatus;
}

export const useGetPlanificationAlerts = (filters?: PlanificationAlertsFilters, enabled = true) => {
  return useQuery({
    queryKey: ['planification-alerts', filters?.aircraft_id ?? null, filters?.item_type ?? null, filters?.status ?? null],
    queryFn: async ({ signal }) => {
      const response = await planificationAlertsIndex({
        query: filters,
        signal,
        throwOnError: true,
      });

      return response.data as PlanificationAlertsResponse;
    },
    enabled,
    refetchOnWindowFocus: false,
  });
};