import CreateNoRutineForm from "@/components/forms/mantenimiento/ordenes_trabajo/CreateNoRutineForm"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

interface CreateNoRutineDialogProps {
  task_id: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CreateNoRutineDialog = ({ task_id, open, onOpenChange }: CreateNoRutineDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="m-0 p-0 max-w-[650px]">
        <CreateNoRutineForm onClose={() => onOpenChange(false)} id={task_id} />
      </DialogContent>
    </Dialog>
  )
}

export default CreateNoRutineDialog
