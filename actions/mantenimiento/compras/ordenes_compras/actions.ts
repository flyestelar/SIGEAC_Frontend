import axiosInstance from "@/lib/axios"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface POArticles {
  article_part_number: string,
  article_purchase_order_id: number,
}

interface CompletePurchaseData {
  freight?: string,
  hazmat?: string,
  total: number,
  updated_by?: string,
  company?: string,
  invoice?: File,
  status?: string,
  articles_purchase_orders: POArticles[]
}

interface CreatePurchaseOrderData {
  status: string,
  justification: string,
  purchase_date: Date,
  sub_total: number,
  total: number,
  vendor_id: number,
  created_by: string,
  articles_purchase_orders: {
    batch: {
      name: string;
    };
    article_part_number: string;
    quantity: number;
    unit_price: string;
    image: string;
  }[]
}

export const useCreatePurchaseOrder = () => {

  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async ({ data, company }: { data: CreatePurchaseOrderData, company: string }) => {
      await axiosInstance.post(`/${company}/purchase-order`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-order'], exact: false })
      toast.success("¡Creado!", {
        description: `La orden de compra ha sido creada correctamente.`
      })
    },
    onError: (error) => {
      toast.error('Oops!', {
        description: 'No se pudo crear la orden de compra...'
      })
      console.log(error)
    },
  }
  )
  return {
    createPurchaseOrder: createMutation,
  }
}

export const useCompletePurchase = () => {

  const queryClient = useQueryClient()

  const completePurchaseMutation = useMutation({
    mutationFn: async ({ id, data, company }: {
      id: number, data: CompletePurchaseData, company: string
    }) => {
      if (data.invoice) {
        const formData = new FormData()

        formData.append('freight', data.freight || '0')
        formData.append('hazmat', data.hazmat || '0')
        formData.append('total', String(data.total))
        formData.append('updated_by', data.updated_by || '')
        formData.append('company', data.company || company)
        formData.append('invoice', data.invoice)
        formData.append('status', data.status || 'pagado')
        formData.append('articles_purchase_orders', JSON.stringify(data.articles_purchase_orders))

        await axiosInstance.put(`/${company}/purchase-order/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        return
      }

      await axiosInstance.put(`/${company}/purchase-order/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success("¡Confirmada!", {
        description: `¡La orden de compra ha sido actualizada correctamente!`
      })
    },
    onError: (e) => {
      toast.error("Oops!", {
        description: "¡Hubo un error al actualizar la orden de compra!"
      })
    },
  }
  )

  return {
    completePurchase: completePurchaseMutation,
  }
}

export const useDeletePurchaseOrder = () => {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async ({ id, company }: { id: number; company: string }) => {
      await axiosInstance.delete(`/${company}/delete-purchase-order/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success('¡Eliminada!', {
        description: '¡La orden de compra ha sido eliminada correctamente!',
      })
    },
    onError: () => {
      toast.error('Oops!', {
        description: '¡Hubo un error al eliminar la orden de compra!',
      })
    },
  })

  return { deletePurchaseOrder: deleteMutation }
}

export const useUpdatePurchaseOrderStatus = () => {
  const queryClient = useQueryClient()

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, company }: { id: number; status: string; company: string }) => {
      await axiosInstance.patch(`/${company}/purchase-order/${id}`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-order'], exact: false })
      toast.success('¡Actualizado!', {
        description: 'El status de la orden de compra ha sido actualizado.',
      })
    },
    onError: () => {
      toast.error('Oops!', {
        description: 'No se pudo actualizar el status de la orden de compra.',
      })
    },
  })

  return { updatePurchaseOrderStatus: updateStatusMutation }
}

export const useDeleteQuote = () => {

  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async ({ id, company }: { id: number, company: string }) => {
      await axiosInstance.post(`/${company}/delete-quote/${id}`, { company })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success("¡Eliminado!", {
        description: `¡La cotización ha sido eliminada correctamente!`
      })
    },
    onError: (e) => {
      toast.error("Oops!", {
        description: "¡Hubo un error al eliminar la cotizacion!"
      })
    },
  }
  )

  return {
    deleteQuote: deleteMutation,
  }
}
