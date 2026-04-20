export type ComponentFormState = {
  category_code: string;
  part_number: string;
  description: string;
  position: string;
};

export type UninstallFormState = {
  removed_at: string;
  aircraft_hours_at_removal: string;
  aircraft_cycles_at_removal: string;
  removal_reason: string;
  remarks: string;
};

export type IntervalFormState = {
  task_description: string;
  interval_hours: string;
  interval_cycles: string;
  interval_days: string;
};

export type ComplianceFormState = {
  hard_time_interval_id: string;
  work_order_id: string;
  compliance_date: string;
  aircraft_hours_at_compliance: string;
  aircraft_cycles_at_compliance: string;
  remarks: string;
};
