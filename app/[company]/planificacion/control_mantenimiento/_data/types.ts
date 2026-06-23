
export type MetricType = 'FH' | 'FC' | 'DAYS';

export type AlertLevel = 'OVERDUE' | 'WARNING' | 'OK';
export type MetricEstimation = { date: Date; days: number; avg?: number; } | null;

export type {
  MaintenanceAircraft,
  MaintenanceControl,
  TaskCard,
} from '@/types';
