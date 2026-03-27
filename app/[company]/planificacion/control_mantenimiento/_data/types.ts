export type IntervalType = "FH" | "FC" | "Calendar" | "Interval";

export interface MaintenanceTask {
  id: string;
  code: string;
  description: string;
  intervalType: IntervalType;
  intervalValue: number;
  currentValue: number;
  dueDate?: string;
  status: "ok" | "warning" | "critical";
}

export interface MaintenanceControl {
  id: string;
  name: string;
  mpdReference: string;
  revision: string;
  effectiveDate: string;
  aircraftId: string;
  tasks: MaintenanceTask[];
}

export interface Aircraft {
  id: string;
  registration: string;
  model: string;
  serialNumber: string;
  totalFH: number;
  totalFC: number;
  controls: MaintenanceControl[];
}
