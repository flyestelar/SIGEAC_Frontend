import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"


import { useUpdateArticleStatus } from "@/actions/mantenimiento/almacen/inventario/articulos/actions"
import { useCompanyStore } from "@/stores/CompanyStore"
import { IterationCw, Loader2, MoreHorizontal, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "../../../ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../../ui/dialog"

const DispatchedArticlesDropdownActions = ({ id }: { id: string | number }) => {

    const [open, setOpen] = useState<boolean>(false)
    const router = useRouter()
    const { updateArticleStatus } = useUpdateArticleStatus()

    const handleUpdate = async (id: number) => {
        await updateArticleStatus.mutateAsync({ id, status: "STORED" }) 
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="flex gap-2 justify-center">
                    <DialogTrigger asChild>
                        <DropdownMenuItem className="cursor-pointer">
                            <IterationCw className='size-5' />
                        </DropdownMenuItem>
                    </DialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-center">¿El componente ha sido devuelto a almacén?</DialogTitle>
                    <DialogDescription className="text-center p-2 mb-0 pb-0">
                        El componente volverá a estar disponible en stock.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col gap-2 md:gap-0">
                    <Button className="bg-rose-400 hover:bg-white hover:text-black hover:border hover:border-black" onClick={() => setOpen(false)} type="submit">Cancelar</Button>
                    <Button disabled={updateArticleStatus.isPending} className="hover:bg-white hover:text-black hover:border hover:border-black transition-all" onClick={() => handleUpdate(Number(id))}>{updateArticleStatus.isPending ? <Loader2 className="size-4 animate-spin" /> : <p>Confirmar</p>}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>


    )
}

export default DispatchedArticlesDropdownActions
