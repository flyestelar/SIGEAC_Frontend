import { Blocks, Building2, User2 } from 'lucide-react';
import { NavGroupMake } from '../menu-list';

export const SistemaMenuGroup: NavGroupMake = () => ({
  groupLabel: 'Sistema',
  menus: [
    {
      href: '/sistema/modulos',
      label: 'Módulos',
      icon: Blocks,
      roles: ['ADMIN', 'SUPERUSER'],
      submenus: [],
    },
    {
      href: '/sistema/usuarios_permisos',
      label: 'Usuarios Y Permisos',
      icon: User2,
      roles: ['ADMIN', 'SUPERUSER'],
      submenus: [
        {
          href: '/sistema/usuarios_permisos/usuarios',
          label: 'Administrar Usuarios',
        },
        {
          href: '/sistema/usuarios_permisos/roles',
          label: 'Administrar Roles',
        },
        // {
        //   href: '/sistema/usuarios_permisos/permisos',
        //   label: 'Administrar Permisos',
        // },
      ],
    },
    {
      href: '/sistema/empresas/',
      label: 'Empresas',
      icon: Building2,
      roles: ['ADMIN', 'SUPERUSER'],
      submenus: [
        {
          href: '/sistema/empresas/empresas',
          label: 'Administrar Empresas',
        },
        {
          href: '/sistema/empresas/almacenes',
          label: 'Administrar Almacenes',
        },
        {
          href: '/sistema/empresas/talleres',
          label: 'Administrar Talleres',
        },
        {
          href: '/sistema/empresas/ubicaciones',
          label: 'Administrar Ubicaciones',
        },
        {
          href: '/sistema/empresas/empleados',
          label: 'Administrar Empleados',
        },
        {
          href: '/sistema/empresas/cargos',
          label: 'Administrar Cargos',
        },
        {
          href: '/sistema/empresas/departamentos',
          label: 'Administrar Departamentos',
        },
      ],
    },
  ],
});
