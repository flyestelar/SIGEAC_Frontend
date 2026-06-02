import { Globe, Landmark, UserRoundCog } from 'lucide-react';
import { NavGroupMake } from '../menu-list';

export const AjustesMenuGroup: NavGroupMake = () => ({
  groupLabel: 'Ajustes',
  menus: [
    {
      href: '/ajustes/globales',
      label: 'Globales',
      icon: Globe,
      roles: ['ANALISTA_ALMACEN', 'JEFE_ALMACEN', 'SUPERUSER', 'JEFE_SMS', 'ANALISTA_SMS'],
      submenus: [
        {
          href: '/ajustes/globales/unidades',
          label: 'Unidades',
          roles: ['ANALISTA_ALMACEN', 'JEFE_ALMACEN', 'SUPERUSER'],
        },
        {
          href: '/ajustes/globales/fabricantes',
          label: 'Fabricantes',
          roles: ['ANALISTA_ALMACEN', 'JEFE_ALMACEN', 'SUPERUSER'],
        },
        {
          href: '/ajustes/globales/proveedores',
          label: 'Proveedores',
          roles: ['ANALISTA_ALMACEN', 'JEFE_ALMACEN', 'SUPERUSER'],
        },
        {
          href: '/ajustes/globales/terceros',
          label: 'Terceros',
          roles: ['ANALISTA_ALMACEN', 'JEFE_ALMACEN', 'SUPERUSER'],
        },
        {
          href: '/ajustes/globales/clientes',
          label: 'Clientes',
          roles: ['ANALISTA_ALMACEN', 'JEFE_ALMACEN', 'SUPERUSER'],
        },
        {
          href: '/ajustes/globales/condiciones',
          label: 'Condiciones',
          roles: ['ANALISTA_ALMACEN', 'JEFE_ALMACEN', 'SUPERUSER'],
        },
        {
          href: '/ajustes/globales/fuentes_informacion',
          label: 'Fuentes de Informacion',
          roles: ['JEFE_SMS', 'ANALISTA_SMS', 'SUPERUSER'],
        },
        {
          href: '/ajustes/globales/sms',
          label: 'Globales SMS',
          roles: ['SUPERUSER', 'JEFE_SMS', 'ANALISTA_SMS'],
        },
      ],
    },
    {
      href: '/ajustes/bancos_cuentas',
      label: 'Bancos',
      icon: Landmark,
      roles: ['SUPERUSER', 'ANALISTA_ADMINISTRACION', 'JEFE_ADMINISTRACION'],
      submenus: [
        {
          href: '/ajustes/bancos_cuentas/bancos',
          label: 'Bancos',
        },
        {
          href: '/ajustes/bancos_cuentas/cuentas',
          label: 'Cuentas',
        },
        {
          href: '/ajustes/bancos_cuentas/tarjetas',
          label: 'Tarjetas',
        },
      ],
    },
    {
      href: '/ajustes/cuenta',
      label: 'Cuenta',
      icon: UserRoundCog,
      roles: [],
      submenus: [],
    },
  ],
});
