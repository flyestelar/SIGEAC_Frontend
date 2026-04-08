import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { WorkOrderResource } from '@api/types';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '../../../ui/button';

const WorkOrderDropdownActions = ({ work_order }: { work_order: WorkOrderResource }) => {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="flex gap-2 justify-center"></DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default WorkOrderDropdownActions;
