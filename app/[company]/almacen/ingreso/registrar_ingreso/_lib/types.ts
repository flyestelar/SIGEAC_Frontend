import { Article, Batch } from '@/types';

export interface EditingArticle extends Article {
  batches: Batch;
  tool?: {
    id: number;
    serial: string;
    isSpecial: boolean;
    needs_calibration: boolean;
    calibration_date?: string;
    next_calibration?: string | number;
    article_id: number;
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
    lot_number?: string;
    caducate_date: string;
    fabrication_date: string;
  };
}

export interface ArticleFormProps {
  isEditing?: boolean;
  initialData?: EditingArticle;
}
