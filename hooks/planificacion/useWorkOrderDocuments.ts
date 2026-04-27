import { DocumentGenerationMetadataResource, planificationWorkOrderDocumentDownload } from '@api/index';
import {
  planificationWorkOrderDocumentQueuePdfMutation,
  planificationWorkOrderDocumentStatusOptions,
  planificationWorkOrderDocumentStatusQueryKey,
  planificationWorkOrderTallySheetQueuePdfMutation,
} from '@api/queries';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type DocumentType = 'work_order' | 'tally_sheet';

type DocState = {
  statusData: DocumentGenerationMetadataResource | null;
  isGenerating: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  isNotGenerated: boolean;
  statusError: string | null;
};

export function useWorkOrderDocuments(orderNumber: string) {
  const queryClient = useQueryClient();

  const workOrderStatusQuery = useQuery({
    ...planificationWorkOrderDocumentStatusOptions({
      path: { order_number: orderNumber ?? '', document_type: 'work_order' },
    }),
    enabled: Boolean(orderNumber),
    retry: false,
    refetchInterval: (query) => {
      const data = query.state.data?.data;
      if (data?.status === 'completed' || data?.status === 'failed' || data?.status === 'not_generated') return false;
      return 2000;
    },
  });

  const tallySheetStatusQuery = useQuery({
    ...planificationWorkOrderDocumentStatusOptions({
      path: { order_number: orderNumber ?? '', document_type: 'tally_sheet' },
    }),
    enabled: Boolean(orderNumber),
    retry: false,
    refetchInterval: (query) => {
      const data = query.state.data?.data;
      if (data?.status === 'completed' || data?.status === 'failed' || data?.status === 'not_generated') return false;
      return 2000;
    },
  });

  const workOrderStatusError = workOrderStatusQuery.error
    ? workOrderStatusQuery.error?.status === 404
      ? 'not_found'
      : 'error'
    : null;

  const tallySheetStatusError = tallySheetStatusQuery.error
    ? tallySheetStatusQuery.error?.status === 404
      ? 'not_found'
      : 'error'
    : null;

  const workOrderStatusData = workOrderStatusQuery.data?.data ?? null;
  const tallySheetStatusData = tallySheetStatusQuery.data?.data ?? null;

  const workOrderQueue = useMutation({
    ...planificationWorkOrderDocumentQueuePdfMutation(),
    onSuccess: () => {
      if (orderNumber) {
        queryClient.invalidateQueries({
          queryKey: planificationWorkOrderDocumentStatusQueryKey({
            path: { order_number: orderNumber, document_type: 'work_order' },
          }),
        });
      }
    },
  });

  const tallySheetQueue = useMutation({
    ...planificationWorkOrderTallySheetQueuePdfMutation(),
    onSuccess: () => {
      if (orderNumber) {
        queryClient.invalidateQueries({
          queryKey: planificationWorkOrderDocumentStatusQueryKey({
            path: { order_number: orderNumber, document_type: 'tally_sheet' },
          }),
        });
      }
    },
  });

  const queueDocument = (type: DocumentType) => {
    if (!orderNumber) return;
    if (type === 'work_order') {
      if (workOrderQueue.status === 'pending') return;
      workOrderQueue.mutate({ path: { order_number: orderNumber } });
      return;
    }
    if (tallySheetQueue.status === 'pending') return;
    tallySheetQueue.mutate({ path: { order_number: orderNumber } });
  };

  const downloadDocument = async (type: DocumentType) => {
    if (!orderNumber) return null;
    try {
      const res = await planificationWorkOrderDocumentDownload({
        path: { order_number: orderNumber, document_type: type },
        throwOnError: true,
      });
      return res.data;
    } catch (e) {
      throw e;
    }
  };

  const workOrder: DocState = {
    statusData: workOrderStatusData,
    isNotGenerated: workOrderStatusData?.status === 'not_generated',
    isGenerating: workOrderStatusData?.status === 'queued' || workOrderStatusData?.status === 'in_progress',
    isCompleted: workOrderStatusData?.status === 'completed',
    isFailed: workOrderStatusError !== null || workOrderStatusData?.status === 'failed',
    statusError: workOrderStatusError,
  };

  const tallySheet: DocState = {
    statusData: tallySheetStatusData,
    isNotGenerated: tallySheetStatusData?.status === 'not_generated',
    isGenerating: tallySheetStatusData?.status === 'queued' || tallySheetStatusData?.status === 'in_progress',
    isCompleted: tallySheetStatusData?.status === 'completed',
    isFailed: tallySheetStatusError !== null || tallySheetStatusData?.status === 'failed',
    statusError: tallySheetStatusError,
  };

  return {
    workOrder,
    tallySheet,
    queueDocument,
    downloadDocument,
    queries: { workOrderStatusQuery, tallySheetStatusQuery },
    mutations: { workOrderQueue, tallySheetQueue },
  } as const;
}

export default useWorkOrderDocuments;
