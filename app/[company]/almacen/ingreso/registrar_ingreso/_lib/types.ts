import { Article, Batch, Condition, Manufacturer } from '@/types';

export interface EditingArticle extends Article {
  batches: Batch;
  condition?: Condition;
  manufacturer?: Manufacturer;
  tool?: {
    id: number;
    needs_calibration: boolean;
    calibration_date?: string | null;
    next_calibration?: string | number | null;
    status?: string | null;
    quantity?: string | number;
    article_id: number;
    tool_box_id?: number | null;
  };
  component?: {
    id: number;
    isFather: string | null;
    article_id: string;
    component_id: string | null;
    caducate_date: string | null;
    fabrication_date: string | null;
    hour_date: string | null;
    cycle_date: string | null;
    calendary_date: string | null;
    quantity: string;
  };
  consumable?: {
    id: number;
    lot_number?: string;
    quantity: string;
    initial_quantity?: string;
    is_managed: boolean;
    caducate_date: string | null;
    fabrication_date: string | null;
    article_id: number;
    convertions?: Array<{
      id: number;
      convertion_rate: number;
      quantity_unit: number;
      secondary_unit: string;
      unit?: { id: number; name: string };
    }>;
  };
}

export interface ArticleFormProps {
  isEditing?: boolean;
  initialData?: EditingArticle;
}
