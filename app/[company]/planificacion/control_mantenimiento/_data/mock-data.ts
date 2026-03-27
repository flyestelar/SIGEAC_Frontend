import type { Aircraft, MaintenanceControl, MaintenanceTask } from "./types";

// Tareas de mantenimiento por aeronave
const tasksAC001: MaintenanceTask[] = [
  {
    id: "task-001",
    code: "24-21-00-01",
    description: "Generator Control Unit - Operational Check",
    intervalType: "FH",
    intervalValue: 3000,
    currentValue: 2850,
    status: "warning",
  },
  {
    id: "task-002",
    code: "32-11-00-02",
    description: "Main Landing Gear - Visual Inspection",
    intervalType: "FC",
    intervalValue: 500,
    currentValue: 320,
    status: "ok",
  },
  {
    id: "task-003",
    code: "05-51-00-01",
    description: "Time Limits - Schedule Maintenance",
    intervalType: "Calendar",
    intervalValue: 365,
    currentValue: 340,
    dueDate: "2026-04-20",
    status: "warning",
  },
  {
    id: "task-004",
    code: "27-31-00-01",
    description: "Rudder Control - Functional Test",
    intervalType: "FH",
    intervalValue: 6000,
    currentValue: 5980,
    status: "critical",
  },
  {
    id: "task-005",
    code: "21-61-00-01",
    description: "Air Conditioning Pack - Performance Test",
    intervalType: "FC",
    intervalValue: 1000,
    currentValue: 650,
    status: "ok",
  },
];

const tasksAC002: MaintenanceTask[] = [
  {
    id: "task-006",
    code: "28-21-00-01",
    description: "Fuel Tank - Inspection",
    intervalType: "Interval",
    intervalValue: 18,
    currentValue: 16,
    dueDate: "2026-05-15",
    status: "warning",
  },
  {
    id: "task-007",
    code: "52-71-00-01",
    description: "Passenger Door - Seal Replacement",
    intervalType: "Calendar",
    intervalValue: 730,
    currentValue: 120,
    dueDate: "2027-11-10",
    status: "ok",
  },
  {
    id: "task-008",
    code: "71-00-00-01",
    description: "Engine - Boroscope Inspection",
    intervalType: "FH",
    intervalValue: 1500,
    currentValue: 1485,
    status: "critical",
  },
];

const tasksAC003: MaintenanceTask[] = [
  {
    id: "task-009",
    code: "29-11-00-01",
    description: "Hydraulic System - Fluid Analysis",
    intervalType: "Calendar",
    intervalValue: 180,
    currentValue: 90,
    dueDate: "2026-06-25",
    status: "ok",
  },
  {
    id: "task-010",
    code: "34-11-00-01",
    description: "Navigation System - Software Update",
    intervalType: "Interval",
    intervalValue: 12,
    currentValue: 11,
    dueDate: "2026-04-01",
    status: "critical",
  },
  {
    id: "task-011",
    code: "36-11-00-01",
    description: "Pneumatic Distribution - Leak Check",
    intervalType: "FH",
    intervalValue: 4000,
    currentValue: 3200,
    status: "ok",
  },
  {
    id: "task-012",
    code: "25-61-00-01",
    description: "Flight Recorder - Download & Analysis",
    intervalType: "Calendar",
    intervalValue: 30,
    currentValue: 28,
    dueDate: "2026-04-05",
    status: "warning",
  },
];

const tasksAC004: MaintenanceTask[] = [
  {
    id: "task-013",
    code: "33-21-00-01",
    description: "Interior Lights - Functional Check",
    intervalType: "Calendar",
    intervalValue: 90,
    currentValue: 45,
    dueDate: "2026-05-20",
    status: "ok",
  },
  {
    id: "task-014",
    code: "38-31-00-01",
    description: "Potable Water System - Disinfection",
    intervalType: "Interval",
    intervalValue: 6,
    currentValue: 5,
    dueDate: "2026-04-15",
    status: "warning",
  },
  {
    id: "task-015",
    code: "79-20-00-01",
    description: "Engine Oil - Analysis",
    intervalType: "FH",
    intervalValue: 500,
    currentValue: 480,
    status: "critical",
  },
  {
    id: "task-016",
    code: "56-11-00-01",
    description: "Windshield - Inspection",
    intervalType: "FC",
    intervalValue: 2000,
    currentValue: 1400,
    status: "ok",
  },
];

// Controles de mantenimiento por aeronave
const controlsAC001: MaintenanceControl[] = [
  {
    id: "mc-001",
    name: "A Check - Scheduled",
    mpdReference: "MPD D6-38278-CMR",
    revision: "Rev. 45",
    effectiveDate: "2026-01-15",
    aircraftId: "ac-001",
    tasks: tasksAC001.slice(0, 3),
  },
  {
    id: "mc-002",
    name: "B Check - Intermediate",
    mpdReference: "MPD D6-38278-CMR",
    revision: "Rev. 45",
    effectiveDate: "2026-01-15",
    aircraftId: "ac-001",
    tasks: tasksAC001.slice(3, 5),
  },
];

const controlsAC002: MaintenanceControl[] = [
  {
    id: "mc-003",
    name: "A Check - Scheduled",
    mpdReference: "MPD D6-38278-CMR",
    revision: "Rev. 45",
    effectiveDate: "2026-02-10",
    aircraftId: "ac-002",
    tasks: tasksAC002,
  },
];

const controlsAC003: MaintenanceControl[] = [
  {
    id: "mc-004",
    name: "A Check - Scheduled",
    mpdReference: "MPD A320-MRB",
    revision: "Rev. 32",
    effectiveDate: "2026-02-01",
    aircraftId: "ac-003",
    tasks: tasksAC003.slice(0, 2),
  },
  {
    id: "mc-005",
    name: "C Check - Heavy",
    mpdReference: "MPD A320-MRB",
    revision: "Rev. 32",
    effectiveDate: "2026-01-20",
    aircraftId: "ac-003",
    tasks: tasksAC003.slice(2, 4),
  },
];

const controlsAC004: MaintenanceControl[] = [
  {
    id: "mc-006",
    name: "A Check - Scheduled",
    mpdReference: "MPD A320-MRB",
    revision: "Rev. 32",
    effectiveDate: "2026-03-01",
    aircraftId: "ac-004",
    tasks: tasksAC004,
  },
];

export const aircraft: Aircraft[] = [
  {
    id: "ac-001",
    registration: "LV-ABC",
    model: "Boeing 737-800",
    serialNumber: "SN-34521",
    totalFH: 24500,
    totalFC: 12300,
    controls: controlsAC001,
  },
  {
    id: "ac-002",
    registration: "LV-XYZ",
    model: "Boeing 737-800",
    serialNumber: "SN-34522",
    totalFH: 18200,
    totalFC: 9100,
    controls: controlsAC002,
  },
  {
    id: "ac-003",
    registration: "LV-DEF",
    model: "Airbus A320",
    serialNumber: "SN-8891",
    totalFH: 32100,
    totalFC: 16050,
    controls: controlsAC003,
  },
  {
    id: "ac-004",
    registration: "LV-GHI",
    model: "Airbus A320",
    serialNumber: "SN-8892",
    totalFH: 28400,
    totalFC: 14200,
    controls: controlsAC004,
  },
];

// Helper para obtener todas las tareas
export function getAllTasks(): MaintenanceTask[] {
  return aircraft.flatMap((ac) => ac.controls.flatMap((c) => c.tasks));
}

// Helper para obtener stats
export function getStats() {
  const allTasks = getAllTasks();
  return {
    totalAircraft: aircraft.length,
    totalTasks: allTasks.length,
    criticalTasks: allTasks.filter((t) => t.status === "critical").length,
    warningTasks: allTasks.filter((t) => t.status === "warning").length,
    okTasks: allTasks.filter((t) => t.status === "ok").length,
  };
}
