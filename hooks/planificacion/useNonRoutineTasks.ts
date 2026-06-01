'use client';
import {
  nonRoutineTaskUpdateStatusMutation,
  nonRoutineTasksDestroyMutation,
  nonRoutineTasksIndexOptions,
  nonRoutineTasksIndexQueryKey,
  nonRoutineTasksShowOptions,
  nonRoutineTasksShowQueryKey,
  nonRoutineTasksStoreMutation,
  nonRoutineTasksUpdateMutation,
  workOrdersShowQueryKey,
} from '@api/queries';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useNonRoutineTasksQuery(workOrderItemTaskId: number) {
  return useQuery({
    ...nonRoutineTasksIndexOptions({
      query: { work_order_item_task_id: workOrderItemTaskId },
    }),
  });
}

export function useNonRoutineTaskQuery(id: number) {
  return useQuery({
    ...nonRoutineTasksShowOptions({
      path: { id },
    }),
  });
}

export function useCreateNonRoutineTaskMutation(orderNumber?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    ...nonRoutineTasksStoreMutation(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: nonRoutineTasksIndexQueryKey({
          query: { work_order_item_task_id: data.work_order_item_task_id },
        }),
      });
      if (orderNumber) {
        queryClient.invalidateQueries({
          queryKey: workOrdersShowQueryKey({ path: { orderNumber } }),
        });
      }
    },
  });
}

export function useUpdateNonRoutineTaskMutation(workOrderItemTaskId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    ...nonRoutineTasksUpdateMutation(),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: nonRoutineTasksIndexQueryKey({
          query: { work_order_item_task_id: workOrderItemTaskId },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: nonRoutineTasksShowQueryKey({ path: { id: variables.path.id } }),
      });
    },
  });
}

export function useUpdateNonRoutineTaskStatusMutation(workOrderItemTaskId: number, orderNumber?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    ...nonRoutineTaskUpdateStatusMutation(),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: nonRoutineTasksIndexQueryKey({
          query: { work_order_item_task_id: workOrderItemTaskId },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: nonRoutineTasksShowQueryKey({ path: { id: variables.path.id } }),
      });
      if (orderNumber) {
        queryClient.invalidateQueries({
          queryKey: workOrdersShowQueryKey({ path: { orderNumber } }),
        });
      }
    },
  });
}

export function useDeleteNonRoutineTaskMutation(workOrderItemTaskId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    ...nonRoutineTasksDestroyMutation(),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: nonRoutineTasksIndexQueryKey({
          query: { work_order_item_task_id: workOrderItemTaskId },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: nonRoutineTasksShowQueryKey({ path: { id: variables.path.id } }),
      });
    },
  });
}
