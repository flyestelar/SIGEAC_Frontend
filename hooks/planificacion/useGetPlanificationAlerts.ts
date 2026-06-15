import { planificationAlertsIndexOptions } from '@api/queries';
import { PlanificationAlertsIndexData } from '@api/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export type PlanificationAlertStatus = 'OK' | 'WARNING' | 'OVERDUE';
export type PlanificationAlertItemType = 'maintenance_control' | 'hard_time' | 'directive';
export type PlanificationAlertMetric = 'CALENDAR' | 'FH' | 'FC';

export const useGetPlanificationAlerts = (
  filters?: PlanificationAlertsIndexData['query'],
  options?: { enabled?: boolean; keepPreviousData?: boolean },
) => {
  return useQuery({
    ...planificationAlertsIndexOptions({
      query: filters,
    }),
    enabled: options?.enabled,
    placeholderData: options?.keepPreviousData ? keepPreviousData : undefined,
    // staleTime: 4 * 60 * 60 * 1000, // 4 horas
  });
};
