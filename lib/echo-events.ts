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

declare module '@laravel/echo-react' {
  interface Events {
    WorkOrderDocumentStatusChanged: WorkOrderDocumentStatusPayload;
  }
}
