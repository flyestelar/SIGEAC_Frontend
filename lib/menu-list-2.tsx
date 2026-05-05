'use client';

import { Company } from '@/types';
import { format } from 'date-fns';
import {
  AreaChartIcon,
  Award,
  Blocks,
  BookUser,
  Building2,
  ClipboardCopy,
  CalendarClock,
  ClipboardList,
  ClipboardPen,
  ClipboardCheck,
  ClockArrowUp,
  CreditCardIcon,
  FileBadge,
  Globe,
  HandCoins,
  Hourglass,
  Landmark,
  LayoutGrid,
  LucideIcon,
  PackageOpen,
  PackagePlus,
  PackageSearch,
  Plane,
  PlaneIcon,
  Receipt,
  Settings,
  ScrollText,
  ShieldAlert,
  SquareArrowDown,
  SquarePen,
  User2,
  UserRoundCog,
} from 'lucide-react';

type Submenu = {
  href: string;
  label: string;
  roles?: string[];
  moduleValue?: string;
};

type Menu = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
  moduleValue?: string;
  submenus: Submenu[];
};

type Group = {
  groupLabel: string;
  moduleValue?: string;
  menus: Menu[];
};

const SUPERUSER_ROLES = ['SUPERUSER'];

export function getMenuList(currentCompany: Company | null, userRoles: string[]): Group[] {
  const date = format(new Date(), 'yyyy-MM-dd');

  const companySlug = currentCompany?.slug;
  const companyPath = (path: string): string => {
    if (!companySlug) return '';
    return `/${companySlug}${path}`;
  };

  // Verificar acceso por rol
  const hasRoleAccess = (menuItem: { roles?: string[] }): boolean => {
    return (
      !menuItem.roles ||
      menuItem.roles.length === 0 ||
      menuItem.roles.some((role) => userRoles.includes(role)) ||
      userRoles.some((role) => SUPERUSER_ROLES.includes(role)) // Acceso para SUPERUSER
    );
  };

  // Verificar si el módulo está activo para la compañía
  const isModuleActive = (moduleValue?: string): boolean => {
    // Si no requiere módulo específico o no hay compañía seleccionada, está activo
    if (!moduleValue) return true;
    if (!currentCompany) return false;
    // Verificar si la compañía tiene este módulo
    return currentCompany.modules.some((m) => m.value === moduleValue);
  };

  const fullMenu: Group[] = [
    {
      groupLabel: '',
      menus: [
        {
          href: companyPath('/dashboard'),
          label: 'Dashboard',
          icon: LayoutGrid,
          roles: [],
          submenus: [],
        },
      ],
    },
    {
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
          href: companyPath('/general/inventario'),
          label: 'Consultar Inventario',
          icon: PackageSearch,
          roles: [],
          submenus: [],
        },
      ],
    },
    {
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
    },
    {
      groupLabel: 'Administración',
      moduleValue: 'administration',
      menus: [
        {
          href: companyPath('/administracion/creditos'),
          label: 'Créditos',
          icon: CreditCardIcon,
          roles: [
            'SUPERUSER',
            'ANALISTA_ADMINISTRACION',
            'JEFE_ADMINISTRACION',
            'JEFE_CONTADURIA',
            'RRHH_ADMINISTRACION',
          ],
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
          roles: [
            'SUPERUSER',
            'ANALISTA_ADMINISTRACION',
            'JEFE_ADMINISTRACION',
            'JEFE_CONTADURIA',
            'RRHH_ADMINISTRACION',
          ],
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
          roles: [
            'SUPERUSER',
            'ANALISTA_ADMINISTRACION',
            'JEFE_ADMINISTRACION',
            'JEFE_CONTADURIA',
            'RRHH_ADMINISTRACION',
          ],
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
              href: `/${companySlug}/administracion/operaciones/arrendamiento`,
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
    },
    {
      groupLabel: 'SMS',
      moduleValue: 'sms',
      menus: [
        {
          href: companyPath('/sms/reportes'),
          label: 'Reportes',
          icon: ClipboardPen,
          roles: ['ANALISTA_SMS', 'JEFE_SMS', 'SUPERUSER'],
          submenus: [],
        },
        {
          href: companyPath('/sms/gestion_reportes'),
          label: 'Gestion de Reportes',
          icon: ShieldAlert,
          roles: ['ANALISTA_SMS', 'JEFE_SMS', 'SUPERUSER'],
          submenus: [
            {
              href: companyPath('/sms/gestion_reportes/peligros_identificados'),
              label: 'Peligros Identificados',
              roles: ['ANALISTA_SMS', 'JEFE_SMS', 'SUPERUSER'],
            },
            {
              href: companyPath('/sms/gestion_reportes/planes_de_mitigacion'),
              label: 'Planes de Mitigacion',
              roles: ['ANALISTA_SMS', 'JEFE_SMS', 'SUPERUSER'],
            },
          ],
        },
        {
          href: companyPath('/sms/estadisticas'),
          label: 'Estadisticas',
          icon: AreaChartIcon,
          roles: ['ANALISTA_SMS', 'JEFE_SMS', 'SUPERUSER'],
          submenus: [
            {
              href: companyPath('/sms/estadisticas/general'),
              label: 'General',
              roles: ['ANALISTA_SMS', 'JEFE_SMS', 'SUPERUSER'],
            },
            {
              href: companyPath('/sms/estadisticas/reportes_voluntarios'),
              label: 'Reportes Voluntarios',
              roles: ['ANALISTA_SMS', 'JEFE_SMS', 'SUPERUSER'],
            },
            {
              href: companyPath('/sms/estadisticas/reportes_obligatorios'),
              label: 'Reportes Obligatorios',
              roles: ['ANALISTA_SMS', 'JEFE_SMS', 'SUPERUSER'],
            },
            {
              href: companyPath('/sms/estadisticas/indicadores_riesgo'),
              label: 'Indicadores de Riesgo',
              roles: ['ANALISTA_SMS', 'JEFE_SMS', 'SUPERUSER'],
            },
            {
              href: companyPath('/sms/estadisticas/actividades'),
              label: 'Actividades',
              roles: ['ANALISTA_SMS', 'JEFE_SMS', 'SUPERUSER'],
            },
          ],
        },

        // {
        //   href: companyPath('/sms/certificados'),
        //   label: "Certificados",
        //   icon: Award,
        //   roles: ["SUPERUSER", "JEFE_SMS", "ANALISTA_SMS"],
        //   submenus: [],
        // },

        {
          href: '',
          label: 'Promoción',
          icon: CalendarClock,
          roles: ['SUPERUSER', 'JEFE_SMS', 'ANALISTA_SMS'],
          submenus: [
            {
              href: companyPath('/sms/promocion/actividades/calendario'),
              label: 'Calendario Actividades',
              roles: ['SUPERUSER', 'JEFE_SMS', 'ANALISTA_SMS'],
            },
            {
              href: companyPath('/sms/promocion/actividades'),
              label: 'Actividades',
              roles: ['SUPERUSER', 'JEFE_SMS', 'ANALISTA_SMS'],
            },
            {
              href: companyPath('/sms/promocion/capacitacion_personal'),
              label: 'Capacitación',
              roles: ['SUPERUSER', 'JEFE_SMS', 'ANALISTA_SMS'],
            },
            // {
            //   href: companyPath('/sms/promocion/boletines'),
            //   label: "Boletines",
            //   roles: ["SUPERUSER", "JEFE_SMS", "ANALISTA_SMS"],
            // },
          ],
        },
        {
          href: '',
          label: 'Gestión de Encuestas',
          icon: ClipboardCheck,
          roles: ['SUPERUSER', 'JEFE_SMS', 'ANALISTA_SMS'],
          submenus: [
            {
              href: companyPath('/sms/gestion_encuestas/crear'),
              label: 'Crear',
              roles: ['SUPERUSER', 'JEFE_SMS', 'ANALISTA_SMS'],
            },
            {
              href: companyPath('/sms/gestion_encuestas/encuestas'),
              label: 'Lista',
              roles: ['SUPERUSER', 'JEFE_SMS', 'ANALISTA_SMS'],
            },
          ],
        },
        {
          href: '',
          label: 'Ajustes SMS',
          icon: Settings,
          roles: ['SUPERUSER', 'JEFE_SMS', 'ANALISTA_SMS'],
          submenus: [
            {
              href: companyPath('/sms/ajustes/encuesta'),
              label: 'Encuesta',
              roles: ['SUPERUSER', 'JEFE_SMS', 'ANALISTA_SMS'],
            },
            {
              href: companyPath('/sms/ajustes/boletin'),
              label: 'Boletines',
              roles: ['SUPERUSER', 'JEFE_SMS', 'ANALISTA_SMS'],
            },
          ],
        },
      ],
    },
    {
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
    },
    {
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
    },
    {
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
          href: companyPath('/almacen/desmontados'),
          label: 'Comp. Desmontados',
          icon: SquareArrowDown,
          roles: ['ANALISTA_ALMACEN', 'JEFE_ALMACEN', 'SUPERUSER'],
          submenus: [],
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
    },
    {
      groupLabel: 'Planificación',
      moduleValue: 'planification',
      menus: [
        {
          href: companyPath('/planificacion/ordenes_trabajo'),
          label: 'Ordenes de Trabajo',
          icon: ClockArrowUp,
          roles: ['ANALISTA_PLANIFICACION', 'JEFE_PLANIFICACION', 'SUPERUSER'],
          submenus: [],
        },
        {
          href: companyPath('/planificacion/control_mantenimiento'),
          label: 'Ctrl. de Mantenimiento',
          icon: ClipboardList,
          roles: ['ANALISTA_PLANIFICACION', 'JEFE_PLANIFICACION', 'SUPERUSER'],
          submenus: [],
        },
        {
          href: companyPath('/planificacion/hard_time'),
          label: 'Ctrl. de Hard Time',
          icon: Hourglass,
          roles: ['ANALISTA_PLANIFICACION', 'JEFE_PLANIFICACION', 'SUPERUSER'],
          submenus: [],
        },
        {
          href: companyPath('/planificacion/control_vuelos'),
          label: 'Ctrl. de Hrs. de Vuelo',
          icon: ClockArrowUp,
          roles: ['ANALISTA_PLANIFICACION', 'JEFE_PLANIFICACION', 'SUPERUSER'],
          submenus: [
            {
              href: companyPath('/planificacion/control_vuelos/vuelos'),
              label: 'Vuelos',
            },
            {
              href: companyPath('/planificacion/control_vuelos/reportes'),
              label: 'Reportes',
            },
          ],
        },
        {
          href: companyPath('/planificacion/aeronaves'),
          label: 'Aeronaves',
          icon: Plane,
          roles: ['ANALISTA_PLANIFICACION', 'JEFE_PLANIFICACION', 'SUPERUSER'],
          submenus: [
            {
              href: companyPath('/planificacion/aeronaves'),
              label: 'Gestión de Aeronaves',
            },
            {
              href: companyPath('/planificacion/aeronaves/tipos'),
              label: 'Gestión de Tipos de Aeronave',
            },
          ],
        },
        {
          href: companyPath('/planificacion/directivas'),
          label: 'Directivas de Aeronavegabilidad',
          icon: FileBadge,
          roles: ['ANALISTA_PLANIFICACION', 'JEFE_PLANIFICACION', 'SUPERUSER'],
          submenus: [],
        },
      ],
    },
    {
      groupLabel: 'Mantenimiento',
      moduleValue: 'maintenance',
      menus: [
        {
          href: companyPath('/mantenimiento/ordenes_trabajo'),
          label: 'Ordenes de Trabajo',
          icon: SquarePen,
          roles: ['SUPERUSER'],
          submenus: [],
        },
      ],
    },
    {
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
          icon: ScrollText,
          roles: ['SUPERUSER'],
          submenus: [],
        },
      ],
    },
    {
      groupLabel: 'Ajustes',
      menus: [
        {
          href: '/ajustes/globales',
          label: 'Globales',
          icon: Globe,
          roles: ['ANALISTA_ALMACEN', 'JEFE_ALMACEN', 'SUPERUSER'],
          submenus: [
            {
              href: '/ajustes/globales/unidades',
              label: 'Unidades',
            },
            {
              href: '/ajustes/globales/fabricantes',
              label: 'Fabricantes',
            },
            {
              href: '/ajustes/globales/proveedores',
              label: 'Proveedores',
            },
            {
              href: '/ajustes/globales/terceros',
              label: 'Terceros',
            },
            {
              href: '/ajustes/globales/clientes',
              label: 'Clientes',
            },
            {
              href: '/ajustes/globales/condiciones',
              label: 'Condiciones',
            },
            {
              href: '/ajustes/globales/fuentes_informacion',
              label: 'Fuentes de Informacion',
              roles: ['JEFE_SMS', 'ANALISTA_SMS', 'SUPERUSER'],
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
    },
    {
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
    },
  ];

  const filteredMenu = fullMenu.filter((group) => {
    if (group.groupLabel === 'General' && userRoles.some((r) => ['JEFE_ALMACEN', 'ANALISTA_ALMACEN'].includes(r))) {
      return false;
    }
    return true;
  });

  // 4. Filtrar el menú completo
  return (
    filteredMenu
      // Filtrar grupos por módulo activo
      .filter((group) => isModuleActive(group.moduleValue))
      // Filtrar menús y submenús
      .map((group) => ({
        ...group,
        menus: group.menus
          .filter((menu) => isModuleActive(menu.moduleValue) && hasRoleAccess(menu))
          .map((menu) => ({
            ...menu,
            submenus: menu.submenus.filter((sub) => isModuleActive(sub.moduleValue) && hasRoleAccess(sub)),
          }))
          .filter((menu) => menu.href || menu.submenus.length > 0),
      }))
      // Eliminar grupos vacíos
      .filter((group) => group.menus.length > 0)
  );
}
