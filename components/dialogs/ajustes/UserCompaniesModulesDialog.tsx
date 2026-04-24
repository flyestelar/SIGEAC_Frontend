'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  modulesIndexOptions,
  userCompaniesModulesByUserOptions,
  userCompaniesModulesByUserQueryKey,
  userGrantModulePermissionMutation,
} from '@api/queries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, View } from 'lucide-react';
import { toast } from 'sonner';

interface UserCompaniesModulesDialogProps {
  userId: string;
  userName: string;
}

export function UserCompaniesModulesDialog({ userId, userName }: UserCompaniesModulesDialogProps) {
  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 shrink-0">
                <View className="size-4" />
                <span className="sr-only">Ver compañías y módulos</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Ver compañías y módulos</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="sm:max-w-3xl">
        <UserCompaniesModulesDialogContent userId={userId} userName={userName} />
      </DialogContent>
    </Dialog>
  );
}

interface UserCompaniesModulesDialogContentProps {
  userId: string;
  userName: string;
}

function UserCompaniesModulesDialogContent({ userId, userName }: UserCompaniesModulesDialogContentProps) {
  const parsedUserId = Number(userId);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    ...userCompaniesModulesByUserOptions({ path: { id: parsedUserId } }),
    enabled: Number.isFinite(parsedUserId),
  });

  const modulesQuery = useQuery(modulesIndexOptions());

  const grantModulePermission = useMutation({
    ...userGrantModulePermissionMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userCompaniesModulesByUserQueryKey({ path: { id: parsedUserId } }),
      });
      toast.success('Permisos actualizados');
    },
    onError: () => {
      toast.error('No se pudieron actualizar los permisos');
    },
  });

  const companies = data?.companies ?? [];
  const allModules = modulesQuery.data ?? [];
  const isLoadingContent = isLoading || modulesQuery.isLoading;
  const hasError = error || modulesQuery.error;

  const handleToggleModule = async (companyId: number, moduleId: number, isSelected: boolean) => {
    await grantModulePermission.mutateAsync({
      body: {
        user_id: parsedUserId,
        company_id: companyId,
        module_id: moduleId,
        is_active: !isSelected,
      },
    });
  };

  return (
    <div className="mx-auto w-full">
      <DialogHeader className="flex flex-row items-center justify-between gap-4 text-left">
        <div className="flex flex-col gap-1">
          <DialogTitle>Compañías y módulos de {userName}</DialogTitle>
          <DialogDescription>
            Cada compañía muestra debajo los módulos que el usuario tiene habilitados.
          </DialogDescription>
        </div>
        
      </DialogHeader>

      <ScrollArea className="mt-4 h-[420px] pr-3">
        <div className="flex flex-col gap-4">
          {isLoadingContent ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : hasError ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">No se pudieron cargar las compañías y módulos.</p>
            </div>
          ) : companies.length > 0 ? (
            companies.map((company) => (
              <div key={company.id} className="rounded-lg border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{company.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {company.modules.length} módulo{company.modules.length === 1 ? '' : 's'} asignado
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    #{company.id}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {allModules.map((module) => {
                    const isSelected = company.modules.some((assignedModule) => assignedModule.id === module.id);

                    return (
                      <button
                        key={module.id}
                        type="button"
                        disabled={grantModulePermission.isPending}
                        onClick={() => handleToggleModule(Number(company.id), module.id, isSelected)}
                        className="text-left"
                      >
                        <Badge
                          variant="outline"
                          className={
                            isSelected
                              ? 'border-sky-500/30 bg-sky-500/10 text-sky-700'
                              : 'border-muted-foreground/20 bg-muted/30 text-muted-foreground'
                          }
                        >
                          {module.label}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">El usuario no tiene compañías asociadas.</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <DialogFooter className="mt-4">
        <DialogClose asChild>
          <Button variant="outline">Cerrar</Button>
        </DialogClose>
      </DialogFooter>
    </div>
  );
}
