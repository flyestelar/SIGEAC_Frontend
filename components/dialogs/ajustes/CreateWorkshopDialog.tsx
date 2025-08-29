'use client'

import CreateWorkshopForm from "@/components/forms/ajustes/CreateWorkshopForm"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { useState } from "react"

export function CreateWorkshopDialog() {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => setOpen(true)} variant={'outline'} className="flex items-center justify-center gap-2 h-8 border-dashed">Crear</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle>Creación de Talleres</DialogTitle>
                    <DialogDescription>
                        Cree un taller de trabajo con la información necesaria.
                    </DialogDescription>
                </DialogHeader>
                <CreateWorkshopForm onClose={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}
