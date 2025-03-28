import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  EditIcon,
  EyeIcon,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useDeleteRenting } from "@/actions/administracion/renta/actions";
import { DefineEndDateForm } from "../forms/DefineEndDateForm";
import { Renting } from "@/types";

const RentingDropdownActions = ({ rent }: { rent: Renting }) => {
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [openRenting, setOpenRenting] = useState<boolean>(false);
  const [openDefine, setOpenDefine] = useState<boolean>(false);
  const router = useRouter();
  const { deleteRenting } = useDeleteRenting();

  const handleDelete = async (id: number | string) => {
    await deleteRenting.mutateAsync(id);
    setOpenDelete(false);
  };

  const handleViewDetails = () => {
    setOpenRenting(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          className="flex gap-2 justify-center"
        >
          {rent.status === "CULMINADO" ? (
            <DropdownMenuItem disabled>
              <span className="text-green-500">Culminado</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setOpenDefine(true)}>
              <EditIcon className="size-5 text-blue-500" />
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setOpenDelete(true)}>
            <Trash2 className="size-5 text-red-500" />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              router.push(`/administracion/renting/${rent.id}`);
            }}
          ></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/*Dialog para eliminar la renta*/}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">
              ¿Seguro que desea eliminar la renta?
            </DialogTitle>
            <DialogDescription className="text-center p-2 mb-0 pb-0">
              Esta acción es irreversible y estaría eliminando por completo el
              permiso seleccionado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              className="bg-rose-400 hover:bg-white hover:text-black hover:border hover:border-black"
              onClick={() => setOpenDelete(false)}
              type="submit"
            >
              Cancelar
            </Button>
            <Button
              disabled={deleteRenting.isPending}
              className="hover:bg-white hover:text-black hover:border hover:border-black transition-all"
              onClick={() => handleDelete(rent.id.toString())}
            >
              {deleteRenting.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <p>Confirmar</p>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/*Dialog para ver el resumen de la renta
      <Dialog open={openRenting} onOpenChange={setOpenRenting}>
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(e) => {
            e.preventDefault(); // Evita que el diálogo se cierre al hacer clic fuera
          }}
        >
          <DialogHeader className="text-center font-bold">
            Resumen de la Renta
          </DialogHeader>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : rentingDetails ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Descripción
                </h3>
                <p className="text-lg font-semibold">
                  {rentingDetails.description}
                </p>
                <Separator />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Estado
                </h3>
                <p className="text-lg font-semibold">{rentingDetails.status}</p>
                <Separator />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Tipo
                </h3>
                <p className="text-lg font-semibold">{rentingDetails.type}</p>
                <Separator />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Precio
                </h3>
                <p className="text-lg font-semibold">{rentingDetails.price}</p>
                <Separator />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Precio Pagado
                </h3>
                <p className="text-lg font-semibold">
                  {rentingDetails.payed_amount}
                </p>
                <Separator />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Fecha de Inicio
                </h3>
                <p className="text-lg font-semibold">
                  {format(rentingDetails.start_date, "PPP", { locale: es })}
                </p>
                <Separator />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Fecha Fin
                </h3>
                <p className="text-lg font-semibold">
                  {format(rentingDetails.end_date, "PPP", { locale: es })}
                </p>
                <Separator />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Fecha Limite
                </h3>
                <p className="text-lg font-semibold">
                  {format(rentingDetails.deadline, "PPP", { locale: es })}
                </p>
                <Separator />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Aeronave
                </h3>
                <p className="text-lg font-semibold">
                  {rentingDetails.aircraft
                    ? rentingDetails.aircraft.acronym
                    : "N/A"}
                </p>
                <Separator />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Cliente
                </h3>
                <p className="text-lg font-semibold">
                  {rentingDetails.client.name}
                </p>
                <Separator />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Articulo
                </h3>
                <p className="text-lg font-semibold">
                  {rentingDetails.article ? rentingDetails.article.name : "N/A"}
                  -
                  {rentingDetails.article
                    ? rentingDetails.article.serial
                    : "N/A"}
                </p>
                <Separator />
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              No se pudo cargar la información de la renta.
            </p>
          )}

          <DialogFooter className="sm:justify-center">
            {/*    <Button
              variant="outline"
              onClick={() =>
                router.push(`/administracion/renting/${id}`)
              }
            >
              Ver detalles completos
            </Button> 
            <Button onClick={() => setOpenRenting(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}

      {/*Dialog para editar la fecha final end_date*/}
      <Dialog open={openDefine} onOpenChange={setOpenDefine}>
        <DialogContent
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Definir Fecha Final</DialogTitle>
          </DialogHeader>
          <DefineEndDateForm
            id={rent.id.toString()}
            onClose={() => setOpenDefine(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RentingDropdownActions;
