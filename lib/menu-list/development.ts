import { format } from 'date-fns';
import { SquarePen } from 'lucide-react';
import { NavGroupMake } from '../menu-list';

export const DevelopmentMenuGroup: NavGroupMake = ({ companyPath }) => {
  const date = format(new Date(), 'yyyy-MM-dd');

  return {
    groupLabel: 'Desarrollo',
    moduleValue: 'development',
    menus: [
      {
        href: companyPath('/desarrollo'),
        label: 'Actividades',
        icon: SquarePen,
        roles: ['ANALISTA_DESARROLLO', 'JEFE_DESARROLLO', 'SUPERUSER'],
        submenus: [
          {
            href: companyPath(`/desarrollo/actividades_diarias/registro/${date}`),
            label: 'Registro de Actividades',
          },
          {
            href: companyPath('/desarrollo/actividades_diarias'),
            label: 'Gestion de Actividades',
          },
        ],
      },
    ],
  };
};
