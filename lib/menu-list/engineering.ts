import { Award, ClipboardList } from 'lucide-react';
import { NavGroupMake } from '../menu-list';

export const EngineeringMenuGroup: NavGroupMake = ({ companyPath }) => ({
  groupLabel: 'Ingenieria',
  moduleValue: 'engineering',
  menus: [
    {
      href: companyPath('/ingenieria/certificados'),
      label: 'Certificados',
      icon: Award,
      roles: ['SUPERUSER'],
      submenus: [],
    },
    {
      href: companyPath('/ingenieria/requisiciones/nueva_requisicion'),
      label: 'Solicitudes de Compras',
      icon: ClipboardList,
      roles: ['SUPERUSER'],
      submenus: [],
    },
  ],
});
