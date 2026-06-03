import { ClipboardList, HandCoins, Receipt } from 'lucide-react';
import { NavGroupMake } from '../menu-list';

export const PurchasesMenuGroup: NavGroupMake = ({ companyPath }) => ({
  groupLabel: 'Compras',
  moduleValue: 'purchases',
  menus: [
    {
      href: companyPath('/compras/solicitudes_material_faltante'),
      label: 'Sol. de Material Faltante',
      icon: ClipboardList,
      roles: ['ANALISTA_COMPRAS', 'JEFE_COMPRAS', 'SUPERUSER'],
      submenus: [],
    },
    {
      href: companyPath('/compras/cotizaciones'),
      label: 'Cotizaciones',
      icon: HandCoins,
      roles: ['ANALISTA_COMPRAS', 'JEFE_COMPRAS', 'SUPERUSER'],
      submenus: [],
    },
    {
      href: companyPath('/compras/ordenes_compra'),
      label: 'Ordenes de Compra',
      icon: Receipt,
      roles: ['ANALISTA_COMPRAS', 'JEFE_COMPRAS', 'SUPERUSER', 'JEFE_ADMINISTRACION'],
      submenus: [],
    },
  ],
});
