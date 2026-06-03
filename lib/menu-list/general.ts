import { FileBadge, PackageSearch, ShieldCheck } from 'lucide-react';
import { NavGroupMake } from '../menu-list';

export const GeneralMenuGroup: NavGroupMake = ({ companyPath }) => ({
  groupLabel: 'General',
  moduleValue: '',
  menus: [
    {
      href: companyPath('/general/cursos'),
      label: 'Cursos',
      roles: [
        'JEFE_ADMINISTRACION',
        'SUPERUSER',
        'JEFE_ALMACEN',
        'JEFE_COMPRAS',
        'JEFE_SMS',
        'JEFE_DESARROLLO',
        'JEFE_CONTADURIA',
        'JEFE_RRHH',
        'JEFE_OPERACIONES',
        'JEFE_MANTENIMIENTO',
        'JEFE_PLANIFICACION',
      ],
      icon: FileBadge,
      submenus: [
        {
          href: companyPath('/general/cursos'),
          label: 'Lista de Cursos',
        },
        {
          href: companyPath('/general/cursos/estadisticas'),
          label: 'Estadisticas',
        },
      ],
    },
    {
      href: companyPath('/general/reporte'),
      label: 'SMS',
      icon: ShieldCheck,
      roles: [],
      submenus: [
        // {
        //     href: companyPath('/general/reporte/voluntario'),
        //     label: "Reporte Voluntario",
        //     roles: [],
        // },
        // {
        //     href: companyPath('/general/reporte/obligatorio'),
        //     label: "Reporte Obligatorio",
        //     roles: [],
        // },
        {
          href: companyPath('/general/reporte/codigos_qr'),
          label: 'Codigos QR',
          roles: [],
        },
      ],
    },
    {
      href: companyPath('/general/inventario'),
      label: 'Consultar Inventario',
      icon: PackageSearch,
      roles: [],
      submenus: [],
    },
  ],
});
