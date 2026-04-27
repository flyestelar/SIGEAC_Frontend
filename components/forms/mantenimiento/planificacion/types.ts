import type { TaskCard } from '@/types';

export type ServiceFormValues = {
  aircraftTypeIds: number[];
  partNumbers: string[];
  tasks: TaskCard[];
};
