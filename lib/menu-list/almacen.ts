import { ClipboardCopy, ClipboardPen, PackageOpen, PackagePlus, PackageSearch, SquareArrowDown } from 'lucide-react';
import { NavGroupMake } from '../menu-list';

export const AlmacenMenuGroup: NavGroupMake = ({ companyPath }) => ({
  groupLabel: 'Almacen',
  moduleValue: 'warehouse',
  menus: [
    {
      href: companyPath('/almacen/inventario'),
      label: 'Inventario',
      icon: PackageSearch,
      roles: ['ANALISTA_ALMACEN', 'JEFE_ALMACEN', 'SUPERUSER'],
      submenus: [],
    },
    {
      href: companyPath('/almacen/salidas'),
      label: 'Salidas',
      icon: ClipboardCopy,
      roles: ['ANALISTA_ALMACEN', 'JEFE_ALMACEN', 'SUPERUSER'],
      submenus: [],
    },
    {
      href: companyPath('/almacen/componentes/desmontados'),
      label: 'Componentes',
      icon: SquareArrowDown,
      roles: ['ANALISTA_ALMACEN', 'JEFE_ALMACEN', 'SUPERUSER'],
      submenus: [
        {
          href: companyPath('/almacen/componentes/montados'),
          label: 'Montados',
        },
        {
          href: companyPath('/almacen/componentes/desmontados'),
          label: 'Desmontados',
        },
        {
          href: companyPath('/almacen/componentes/solicitudes'),
          label: 'Solicitudes de Instalación',
        },
      ],
    },
    {
      href: companyPath('/almacen/despachados'),
      label: 'Materiales Despachados',
      icon: PackageOpen,
      roles: ['ANALISTA_ALMACEN', 'JEFE_ALMACEN', 'SUPERUSER'],
      submenus: [],
    },
    {
      href: companyPath('/almacen/material_faltante'),
      label: 'Sol. de Material Falt.',
      roles: ['ANALISTA_ALMACEN', 'JEFE_ALMACEN', 'SUPERUSER'],
      icon: PackagePlus,
      submenus: [],
    },
    {
      href: companyPath('/almacen/gestion_cantidades'),
      label: 'Gestión de Cantidades',
      icon: ClipboardPen,
      roles: ['ANALISTA_ALMACEN', 'JEFE_ALMACEN', 'SUPERUSER'],
      submenus: [],
    },
  ],
});
