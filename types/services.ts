
export type MaintenanceProgramService = {
  id: number;
  title: string;
  description: string;
  nro_ata: string | null;
  threshold_fh: number | null;
  threshold_fc: number | null;
  threshold_days: number | null;
  repeat_fh: number | null;
  repeat_fc: number | null;
  repeat_days: number | null;
  task_cards?: Array<unknown>;
  applicable_aircraft_types?: Array<unknown>;
  parts_applicabilities?: Array<unknown>;

  part_numbers_count?: number;
  applicable_aircraft_types_count?: number;
  task_cards_count?: number;
};
