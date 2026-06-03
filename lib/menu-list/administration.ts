import { BookUser, CreditCardIcon, Landmark, PackageOpen, PlaneIcon } from 'lucide-react';
import { NavGroupMake } from '../menu-list';

export const AdministrationMenuGroup: NavGroupMake = ({ companyPath }) => ({
  groupLabel: 'Administración',
  moduleValue: 'administration',
  menus: [
    {
      href: companyPath('/administracion/creditos'),
      label: 'Créditos',
      icon: CreditCardIcon,
      roles: ['SUPERUSER', 'ANALISTA_ADMINISTRACION', 'JEFE_ADMINISTRACION', 'JEFE_CONTADURIA', 'RRHH_ADMINISTRACION'],
      submenus: [
        {
          href: companyPath('/administracion/creditos/credito_arrendamiento'),
          label: 'Arrendamiento',
        },
        {
          href: companyPath('/administracion/creditos/cuentas_por_pagar'),
          label: 'Cuentas por Pagar',
        },
        {
          href: companyPath('/administracion/creditos/credito_vuelo'),
          label: 'Vuelos',
        },
      ],
    },
    {
      href: companyPath('/administracion/gestion_cajas'),
      label: 'Finanzas',
      icon: Landmark,
      roles: ['SUPERUSER', 'ANALISTA_ADMINISTRACION', 'JEFE_ADMINISTRACION', 'JEFE_CONTADURIA', 'RRHH_ADMINISTRACION'],
      submenus: [
        {
          href: companyPath('/administracion/gestion_cajas/categorias'),
          label: 'Categorías',
        },
        {
          href: companyPath('/administracion/gestion_cajas/cajas'),
          label: 'Cajas',
        },
        {
          href: companyPath('/administracion/gestion_cajas/cuentas'),
          label: 'Cuentas',
        },
        {
          href: companyPath('/administracion/gestion_cajas/movimientos'),
          label: 'Movimientos',
        },
      ],
    },
    {
      href: companyPath('/administracion/gestion_general'),
      label: 'General',
      icon: BookUser,
      roles: ['SUPERUSER', 'ANALISTA_ADMINISTRACION', 'JEFE_ADMINISTRACION', 'JEFE_CONTADURIA', 'RRHH_ADMINISTRACION'],
      submenus: [
        {
          href: companyPath('/administracion/gestion_general/clientes'),
          label: 'Clientes',
        },
        {
          href: companyPath('/administracion/gestion_general/proveedor'),
          label: 'Proveedor',
        },
      ],
    },
    {
      href: companyPath('/administracion/operaciones'),
      label: 'Operaciones',
      icon: PackageOpen,
      roles: ['SUPERUSER', 'ANALISTA_ADMINISTRACION', 'JEFE_ADMINISTRACION'],
      submenus: [
        {
          href: companyPath('/administracion/operaciones/arrendamiento'),
          label: 'Arrendamiento',
        },
      ],
    },
    {
      href: companyPath('/administracion/gestion_vuelos'),
      label: 'Vuelos',
      icon: PlaneIcon,
      roles: ['SUPERUSER', 'ANALISTA_ADMINISTRACION', 'JEFE_ADMINISTRACION', 'RRHH_ADMINISTRACION'],
      submenus: [
        {
          href: companyPath('/administracion/gestion_vuelos/aviones'),
          label: 'Aeronaves',
          roles: ['SUPERUSER', 'ANALISTA_ADMINISTRACION', 'JEFE_ADMINISTRACION', 'RRHH_ADMINISTRACION'],
        },
        {
          href: companyPath('/administracion/gestion_vuelos/rutas'),
          label: 'Rutas',
          roles: ['SUPERUSER', 'ANALISTA_ADMINISTRACION', 'JEFE_ADMINISTRACION'], // RRHH no puede ver Rutas
        },
        {
          href: companyPath('/administracion/gestion_vuelos/vuelos'),
          label: 'Vuelos',
          roles: ['SUPERUSER', 'ANALISTA_ADMINISTRACION', 'JEFE_ADMINISTRACION'], // RRHH no puede ver Vuelos
        },
      ],
    },
  ],
});
