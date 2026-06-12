/* ─── Broadcast event payload types ─── */

export interface WorkOrderDocumentStatusPayload {
  order_number: string;
  document_type: 'work_order' | 'tally_sheet';
  format: 'pdf' | 'docx';
  status: 'completed' | 'failed';
  generation_id: string | null;
  download_url: string | null;
  error: string | null;
  [key: string]: unknown;
}

export interface RequisitionNotificationPayload {
  id: string;
  requisition_id: number | string;
  title?: string;
  message?: string;
  url?: string;
  icon?: string;
  [key: string]: unknown;
}

declare module '@laravel/echo-react' {
  interface Events {
    WorkOrderDocumentStatusChanged: WorkOrderDocumentStatusPayload;
    'requisition-notification-event': RequisitionNotificationPayload;
  }
}
