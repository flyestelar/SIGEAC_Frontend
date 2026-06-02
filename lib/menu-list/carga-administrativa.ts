import { PackagePlus, Receipt } from 'lucide-react';
import { NavGroupMake } from '../menu-list';

export const CargaAdministrativaMenuGroup: NavGroupMake = ({ companyPath }) => ({
  groupLabel: 'Carga Administrativa',
  moduleValue: 'warehouse',
  menus: [
    {
      href: companyPath('/almacen/ingreso'),
      label: 'Control de Ingreso',
      icon: PackagePlus,
      roles: ['ANALISTA_ALMACEN', 'ANALISTA_COMPRAS', 'SUPERUSER', 'JEFE_ALMACEN'],
      submenus: [
        {
          href: companyPath('/almacen/ingreso/registrar_ingreso'),
          label: 'Ingreso de Matarial',
        },
        // {
        //   href: companyPath('/almacen/ingreso/en_transito'),
        //   label: "Materiales en Tránsito",
        // },
        // {
        //   href: companyPath('/almacen/ingreso/en_recepcion'),
        //   label: "Materiales en Recepción",
        // },
      ],
    },
    {
      href: companyPath('/gestion_costos'),
      label: 'Gestión de Costos',
      icon: Receipt,
      roles: ['ANALISTA_COMPRAS', 'SUPERUSER', 'JEFE_COMPRAS'],
      submenus: [],
    },
  ],
});
