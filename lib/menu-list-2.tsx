'use client';

import { Company } from '@/types';
import { format } from 'date-fns';
import {
  Activity,
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
  Clock11,
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
  active: boolean;
  roles?: string[];
  moduleValue?: string;
};

type Menu = {
  href: string;
  label: string;
  active: boolean;
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

export function getMenuList(pathname: string, currentCompany: Company | null, userRoles: string[]): Group[] {
  const date = format(new Date(), 'yyyy-MM-dd');
  const normalizedPathname = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  const companyPath = (path: string): string => {
    if (!currentCompany?.slug) return '';
    return `/${currentCompany.slug}${path}`;
  };

  const isCompanyPath = (path: string, match: 'exact' | 'includes' = 'exact'): boolean => {
    const target = companyPath(path);
    if (!target) return false;

    return match === 'exact' ? normalizedPathname === target : normalizedPathname.startsWith(target);
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
          active: isCompanyPath('/dashboard', 'includes'),
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
          active: isCompanyPath('/general/cursos'),
          icon: FileBadge,
          submenus: [
            {
              href: companyPath('/general/cursos'),
              label: 'Lista de Cursos',
              active: isCompanyPath('/general/cursos'),
            },
            {
              href: companyPath('/general/cursos/estadisticas'),
              label: 'Estadisticas',
              active: isCompanyPath('/general/cursos/estadisticas'),
            },
          ],
        },
        {
          href: companyPath('/general/inventario'),
          label: 'Consultar Inventario',
          active: isCompanyPath('/general/inventario', 'includes'),
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
          active: isCompanyPath('/desarrollo', 'includes'),
          icon: SquarePen,
          roles: ['ANALISTA_DESARROLLO', 'JEFE_DESARROLLO', 'SUPERUSER'],
          submenus: [
            {
              href: companyPath(`/desarrollo/actividades_diarias/registro/${date}`),
              label: 'Registro de Actividades',
              active: isCompanyPath('/desarrollo/actividades_diarias/registro', 'includes'),
            },
            {
              href: companyPath('/desarrollo/actividades_diarias'),
              label: 'Gestion de Actividades',
              active: isCompanyPath('/desarrollo/actividades_diarias'),
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
          href: `/${currentCompany?.slug}/administracion/creditos`,
          label: 'Créditos',
          active: pathname.includes(`/${currentCompany?.slug}/administracion/creditos`),
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
              href: `/${currentCompany?.slug}/administracion/creditos/credito_arrendamiento`,
              label: 'Arrendamiento',
              active: pathname === `/${currentCompany?.slug}/administracion/creditos/credito_arrendamiento`,
            },
            {
              href: `/${currentCompany?.slug}/administracion/creditos/cuentas_por_pagar`,
              label: 'Cuentas por Pagar',
              active: pathname === `/${currentCompany?.slug}/administracion/creditos/cuentas_por_pagar`,
            },
            {
              href: `/${currentCompany?.slug}/administracion/creditos/credito_vuelo`,
              label: 'Vuelos',
              active: pathname === `/${currentCompany?.slug}/administracion/creditos/credito_vuelo`,
            },
          ],
        },
        {
          href: `/${currentCompany?.slug}/administracion/gestion_cajas`,
          label: 'Finanzas',
          active: pathname.includes(`/${currentCompany?.slug}/administracion/gestion_cajas`),
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
              href: `/${currentCompany?.slug}/administracion/gestion_cajas/categorias`,
              label: 'Categorías',
              active: pathname === `/${currentCompany?.slug}/administracion/gestion_cajas/categorias`,
            },
            {
              href: `/${currentCompany?.slug}/administracion/gestion_cajas/cajas`,
              label: 'Cajas',
              active: pathname === `/${currentCompany?.slug}/administracion/gestion_cajas/cajas`,
            },
            {
              href: `/${currentCompany?.slug}/administracion/gestion_cajas/cuentas`,
              label: 'Cuentas',
              active: pathname === `/${currentCompany?.slug}/administracion/gestion_cajas/cuentas`,
            },
            {
              href: `/${currentCompany?.slug}/administracion/gestion_cajas/movimientos`,
              label: 'Movimientos',
              active: pathname === `/${currentCompany?.slug}/administracion/gestion_cajas/movimientos`,
            },
          ],
        },
        {
          href: `/${currentCompany?.slug}/administracion/gestion_general`,
          label: 'General',
          active: pathname.includes(`/${currentCompany?.slug}/administracion/gestion_general`),
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
              href: `/${currentCompany?.slug}/administracion/gestion_general/clientes`,
              label: 'Clientes',
              active: pathname === `/${currentCompany?.slug}/administracion/gestion_general/clientes`,
            },
            {
              href: `/${currentCompany?.slug}/administracion/gestion_general/proveedor`,
              label: 'Proveedor',
              active: pathname === `/${currentCompany?.slug}/administracion/gestion_general/proveedor`,
            },
          ],
        },
        {
          href: `/${currentCompany?.slug}/administracion/operaciones`,
          label: 'Operaciones',
          active: pathname.includes(`/${currentCompany?.slug}/administracion/operaciones`),
          icon: PackageOpen,
          roles: ['SUPERUSER', 'ANALISTA_ADMINISTRACION', 'JEFE_ADMINISTRACION'],
          submenus: [
            {
              href: `/${currentCompany?.slug}/administracion/operaciones/arrendamiento`,
              label: 'Arrendamiento',
              active: pathname === `/${currentCompany?.slug}/administracion/operaciones/arrendamiento`,
            },
          ],
        },
        {
          href: `/${currentCompany?.slug}/administracion/gestion_vuelos`,
          label: 'Vuelos',
          active: pathname.includes(`/${currentCompany?.slug}/administracion/gestion_vuelos`),
          icon: PlaneIcon,
          roles: ['SUPERUSER', 'ANALISTA_ADMINISTRACION', 'JEFE_ADMINISTRACION', 'RRHH_ADMINISTRACION'],
          submenus: [
            {
              href: `/${currentCompany?.slug}/administracion/gestion_vuelos/aviones`,
              label: 'Aeronaves',
              active: pathname === `/${currentCompany?.slug}/administracion/gestion_vuelos/aviones`,
              roles: ['SUPERUSER', 'ANALISTA_ADMINISTRACION', 'JEFE_ADMINISTRACION', 'RRHH_ADMINISTRACION'],
            },
            {
              href: `/${currentCompany?.slug}/administracion/gestion_vuelos/rutas`,
              label: 'Rutas',
              active: pathname === `/${currentCompany?.slug}/administracion/gestion_vuelos/rutas`,
              roles: ['SUPERUSER', 'ANALISTA_ADMINISTRACION', 'JEFE_ADMINISTRACION'], // RRHH no puede ver Rutas
            },
            {
              href: `/${currentCompany?.slug}/administracion/gestion_vuelos/vuelos`,
              label: 'Vuelos',
              active: pathname === `/${currentCompany?.slug}/administracion/gestion_vuelos/vuelos`,
              roles: ['SUPERUSER', 'ANALISTA_ADMINISTRACION', 'JEFE_ADMINISTRACION'], // RRHH no puede ver Vuelos
            },
          ],
        },
      ],
    },
    {
            groupLabel: "SMS",
            moduleValue: "sms",
            menus: [
                {
                    href: `/${currentCompany?.slug}/sms/reportes`,
                    label: "Reportes",
                    active: pathname.includes(`/${currentCompany?.slug}/sms/reportes`),
                    icon: ClipboardPen,
                    roles: ["ANALISTA_SMS", "JEFE_SMS", "SUPERUSER"],
                    submenus: [],
                },
                {
                    href: `/${currentCompany?.slug}/sms/gestion_reportes`,
                    label: "Gestion de Reportes",
                    active: pathname.includes(
                        `/${currentCompany?.slug}/sms/gestion_reportes`,
                    ),
                    icon: ShieldAlert,
                    roles: ["ANALISTA_SMS", "JEFE_SMS", "SUPERUSER"],
                    submenus: [
                        {
                            href: `/${currentCompany?.slug}/sms/gestion_reportes/peligros_identificados`,
                            label: "Peligros Identificados",
                            roles: ["ANALISTA_SMS", "JEFE_SMS", "SUPERUSER"],
                            active:
                                pathname ===
                                `/${currentCompany?.slug}/sms/gestion_reportes/peligros_identificados`,
                        },
                        {
                            href: `/${currentCompany?.slug}/sms/gestion_reportes/planes_de_mitigacion`,
                            label: "Planes de Mitigacion",
                            roles: ["ANALISTA_SMS", "JEFE_SMS", "SUPERUSER"],
                            active:
                                pathname ===
                                `/${currentCompany?.slug}/sms/gestion_reportes/planes_de_mitigacion`,
                        },
                    ],
                },
                {
                    href: `/${currentCompany?.slug}/sms/estadisticas`,
                    label: "Estadisticas",
                    icon: AreaChartIcon,
                    active: pathname.includes(
                        `/${currentCompany?.slug}/sms/estadisticas`,
                    ),
                    roles: ["ANALISTA_SMS", "JEFE_SMS", "SUPERUSER"],
                    submenus: [
                        {
                            href: `/${currentCompany?.slug}/sms/estadisticas/general`,
                            label: "General",
                            roles: ["ANALISTA_SMS", "JEFE_SMS", "SUPERUSER"],
                            active:
                                pathname ===
                                `/${currentCompany?.slug}/sms/estadisticas/general`,
                        },
                        {
                            href: `/${currentCompany?.slug}/sms/estadisticas/reportes_voluntarios`,
                            label: "Reportes Voluntarios",
                            roles: ["ANALISTA_SMS", "JEFE_SMS", "SUPERUSER"],
                            active:
                                pathname ===
                                `/${currentCompany?.slug}/sms/estadisticas/reportes_voluntarios`,
                        },
                        {
                            href: `/${currentCompany?.slug}/sms/estadisticas/reportes_obligatorios`,
                            label: "Reportes Obligatorios",
                            roles: ["ANALISTA_SMS", "JEFE_SMS", "SUPERUSER"],
                            active:
                                pathname ===
                                `/${currentCompany?.slug}/sms/estadisticas/reportes_obligatorios`,
                        },
                        {
                            href: `/${currentCompany?.slug}/sms/estadisticas/indicadores_riesgo`,
                            label: "Indicadores de Riesgo",
                            roles: ["ANALISTA_SMS", "JEFE_SMS", "SUPERUSER"],
                            active:
                                pathname ===
                                `/${currentCompany?.slug}/sms/estadisticas/indicadores_riesgo`,
                        },
                        {
                            href: `/${currentCompany?.slug}/sms/estadisticas/actividades`,
                            label: "Actividades",
                            roles: ["ANALISTA_SMS", "JEFE_SMS", "SUPERUSER"],
                            active:
                                pathname ===
                                `/${currentCompany?.slug}/sms/estadisticas/actividades`,
                        },
                    ],
                },

                // {
                //   href: `/${currentCompany?.slug}/sms/certificados`,
                //   label: "Certificados",
                //   active: pathname.includes(`/${currentCompany?.slug}/sms/certificados`),
                //   icon: Award,
                //   roles: ["SUPERUSER", "JEFE_SMS", "ANALISTA_SMS"],
                //   submenus: [],
                // },

                {
                    href: "",
                    label: "Promoción",
                    active: pathname.includes(`/${currentCompany?.slug}/sms/promocion`),
                    icon: CalendarClock,
                    roles: ["SUPERUSER", "JEFE_SMS", "ANALISTA_SMS"],
                    submenus: [
                        {
                            href: `/${currentCompany?.slug}/sms/promocion/actividades/calendario`,
                            label: "Calendario Actividades",
                            roles: ["SUPERUSER", "JEFE_SMS", "ANALISTA_SMS"],
                            active:
                                pathname ===
                                `/${currentCompany?.slug}/sms/promocion/actividades/calendario`,
                        },
                        {
                            href: `/${currentCompany?.slug}/sms/promocion/actividades`,
                            label: "Actividades",
                            roles: ["SUPERUSER", "JEFE_SMS", "ANALISTA_SMS"],
                            active:
                                pathname ===
                                `/${currentCompany?.slug}/sms/promocion/actividades`,
                        },
                        {
                            href: `/${currentCompany?.slug}/sms/promocion/capacitacion_personal`,
                            label: "Capacitación",
                            roles: ["SUPERUSER", "JEFE_SMS", "ANALISTA_SMS"],
                            active:
                                pathname ===
                                `/${currentCompany?.slug}/sms/promocion/capacitacion_personal`,
                        },
                        // {
                        //   href: `/${currentCompany?.slug}/sms/promocion/boletines`,
                        //   label: "Boletines",
                        //   roles: ["SUPERUSER", "JEFE_SMS", "ANALISTA_SMS"],
                        //   active:
                        //     pathname ===
                        //     `/${currentCompany?.slug}/sms/promocion/boletines`,
                        // },
                    ],
                },
                {
                    href: "",
                    label: "Gestión de Encuestas",
                    active: pathname.includes(
                        `/${currentCompany?.slug}/sms/gestion_encuestas`,
                    ),
                    icon: ClipboardCheck,
                    roles: ["SUPERUSER", "JEFE_SMS", "ANALISTA_SMS"],
                    submenus: [
                        {
                            href: `/${currentCompany?.slug}/sms/gestion_encuestas/crear`,
                            label: "Crear",
                            roles: ["SUPERUSER", "JEFE_SMS", "ANALISTA_SMS"],
                            active:
                                pathname ===
                                `/${currentCompany?.slug}/sms/gestion_encuestas/crear`,
                        },
                        {
                            href: `/${currentCompany?.slug}/sms/gestion_encuestas/encuestas`,
                            label: "Lista",
                            roles: ["SUPERUSER", "JEFE_SMS", "ANALISTA_SMS"],
                            active:
                                pathname ===
                                `/${currentCompany?.slug}/sms/gestion_encuestas/encuestas`,
                        },
                    ],
                },
                {
                    href: "",
                    label: "Ajustes SMS",
                    active: pathname.includes(`/${currentCompany?.slug}/sms/ajustes`),
                    icon: Settings,
                    roles: ["SUPERUSER", "JEFE_SMS", "ANALISTA_SMS"],
                    submenus: [
                        {
                            href: `/${currentCompany?.slug}/sms/ajustes/encuesta`,
                            label: "Encuesta",
                            roles: ["SUPERUSER", "JEFE_SMS", "ANALISTA_SMS"],
                            active:
                                pathname === `/${currentCompany?.slug}/sms/ajustes/encuesta`,
                        },
                        {
                            href: `/${currentCompany?.slug}/sms/ajustes/boletin`,
                            label: "Boletines",
                            roles: ["SUPERUSER", "JEFE_SMS", "ANALISTA_SMS"],
                            active:
                                pathname === `/${currentCompany?.slug}/sms/ajustes/boletin`,
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
          active: isCompanyPath('/compras/solicitudes_material_faltante', 'includes'),
          icon: ClipboardList,
          roles: ['ANALISTA_COMPRAS', 'JEFE_COMPRAS', 'SUPERUSER'],
          submenus: [],
        },
        {
          href: companyPath('/compras/cotizaciones'),
          label: 'Cotizaciones',
          active: isCompanyPath('/compras/cotizaciones', 'includes'),
          icon: HandCoins,
          roles: ['ANALISTA_COMPRAS', 'JEFE_COMPRAS', 'SUPERUSER'],
          submenus: [],
        },
        {
          href: companyPath('/compras/ordenes_compra'),
          label: 'Ordenes de Compra',
          active: isCompanyPath('/compras/ordenes_compra', 'includes'),
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
          href: '',
          label: 'Control de Ingreso',
          active: isCompanyPath('/almacen/ingreso', 'includes'),
          icon: PackagePlus,
          roles: ['ANALISTA_ALMACEN', 'ANALISTA_COMPRAS', 'SUPERUSER', 'JEFE_ALMACEN'],
          submenus: [
            {
              href: companyPath('/almacen/ingreso/registrar_ingreso'),
              label: 'Ingreso de Matarial',
              active: isCompanyPath('/almacen/ingreso/registrar_ingreso'),
            },
            // {
            //   href: `/${currentCompany?.slug}/almacen/ingreso/en_transito`,
            //   label: "Materiales en Tránsito",
            //   active: pathname === `/${currentCompany?.slug}/almacen/ingreso/en_transito`
            // },
            // {
            //   href: `/${currentCompany?.slug}/almacen/ingreso/en_recepcion`,
            //   label: "Materiales en Recepción",
            //   active: pathname === `/${currentCompany?.slug}/almacen/ingreso/en_recepcion`
            // },
          ],
        },
        {
          href: `/${currentCompany?.slug}/gestion_costos`,
          label: 'Gestión de Costos',
          active: pathname.includes(`/${currentCompany?.slug}/gestion_costos`),
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
          href: `/${currentCompany?.slug}/almacen/inventario`,
          label: 'Inventario',
          active: pathname.includes(`/${currentCompany?.slug}/almacen/inventario`),
          icon: PackageSearch,
          roles: ['ANALISTA_ALMACEN', 'JEFE_ALMACEN', 'SUPERUSER'],
          submenus: [],
        },
        {
          href: `/${currentCompany?.slug}/almacen/salidas`,
          label: 'Salidas',
          active: pathname.includes(`/${currentCompany?.slug}/almacen/salidas`),
          icon: ClipboardCopy,
          roles: ['ANALISTA_ALMACEN', 'JEFE_ALMACEN', 'SUPERUSER'],
          submenus: [],
        },
        {
          href: `/${currentCompany?.slug}/almacen/desmontados`,
          label: 'Comp. Desmontados',
          active: pathname.includes(`/${currentCompany?.slug}/almacen/desmontados`),
          icon: SquareArrowDown,
          roles: ['ANALISTA_ALMACEN', 'JEFE_ALMACEN', 'SUPERUSER'],
          submenus: [],
        },
        {
          href: `/${currentCompany?.slug}/almacen/despachados`,
          label: 'Materiales Despachados',
          active: pathname.includes(`/${currentCompany?.slug}/almacen/despachados`),
          icon: PackageOpen,
          roles: ['ANALISTA_ALMACEN', 'JEFE_ALMACEN', 'SUPERUSER'],
          submenus: [],
        },
        {
          href: `/${currentCompany?.slug}/almacen/material_faltante`,
          label: 'Sol. de Material Falt.',
          roles: ['ANALISTA_ALMACEN', 'JEFE_ALMACEN', 'SUPERUSER'],
          active: pathname.includes(`/${currentCompany?.slug}/almacen/material_faltante`),
          icon: PackagePlus,
          submenus: [],
        },
        {
          href: companyPath('/almacen/gestion_cantidades'),
          label: 'Gestión de Cantidades',
          active: isCompanyPath('/almacen/gestion_cantidades', 'includes'),
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
          active: isCompanyPath('/planificacion/ordenes_trabajo', 'includes'),
          icon: ClockArrowUp,
          roles: ['ANALISTA_PLANIFICACION', 'JEFE_PLANIFICACION', 'SUPERUSER'],
          submenus: [],
        },
        {
          href: companyPath('/planificacion/control_mantenimiento'),
          label: 'Ctrl. de Mantenimiento',
          active: isCompanyPath('/planificacion/control_mantenimiento', 'includes'),
          icon: ClipboardList,
          roles: ['ANALISTA_PLANIFICACION', 'JEFE_PLANIFICACION', 'SUPERUSER'],
          submenus: [],
        },
        {
          href: companyPath('/planificacion/hard_time'),
          label: 'Ctrl. de Hard Time',
          active: isCompanyPath('/planificacion/hard_time', 'includes'),
          icon: Hourglass,
          roles: ['ANALISTA_PLANIFICACION', 'JEFE_PLANIFICACION', 'SUPERUSER'],
          submenus: [],
        },
        {
          href: companyPath('/planificacion/control_vuelos'),
          label: 'Ctrl. de Hrs. de Vuelo',
          active: isCompanyPath('/planificacion/control_vuelos', 'includes'),
          icon: ClockArrowUp,
          roles: ['ANALISTA_PLANIFICACION', 'JEFE_PLANIFICACION', 'SUPERUSER'],
          submenus: [
            {
              href: companyPath('/planificacion/control_vuelos/vuelos'),
              label: 'Vuelos',
              active: isCompanyPath('/planificacion/control_vuelos/vuelos'),
            },
            {
              href: companyPath('/planificacion/control_vuelos/reportes'),
              label: 'Reportes',
              active: isCompanyPath('/planificacion/control_vuelos/reportes'),
            },
          ],
        },
        {
          href: companyPath('/planificacion/aeronaves'),
          label: 'Aeronaves',
          active: isCompanyPath('/planificacion/aeronaves', 'includes'),
          icon: Plane,
          roles: ['ANALISTA_PLANIFICACION', 'JEFE_PLANIFICACION', 'SUPERUSER'],
          submenus: [
            {
              href: companyPath('/planificacion/aeronaves'),
              label: 'Gestión de Aeronaves',
              active: isCompanyPath('/planificacion/aeronaves'),
            },
            {
              href: companyPath('/planificacion/aeronaves/tipos'),
              label: 'Gestión de Tipos de Aeronave',
              active: isCompanyPath('/planificacion/aeronaves/tipos'),
            },
          ],
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
          active: isCompanyPath('/mantenimiento/ordenes_trabajo', 'includes'),
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
          active: isCompanyPath('/ingenieria/certificados', 'includes'),
          icon: Award,
          roles: ['SUPERUSER'],
          submenus: [],
        },
        {
          href: companyPath('/ingenieria/requisiciones/nueva_requisicion'),
          label: 'Solicitudes de Compras',
          active: isCompanyPath('/ingenieria/requisiciones/nueva_requisicion', 'includes'),
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
          active: pathname.includes('/ajustes/globales'),
          icon: Globe,
          roles: ['ANALISTA_ALMACEN', 'JEFE_ALMACEN', 'SUPERUSER'],
          submenus: [
            {
              href: '/ajustes/globales/unidades',
              label: 'Unidades',
              active: pathname === '/ajustes/globales/unidades',
            },
            {
              href: '/ajustes/globales/fabricantes',
              label: 'Fabricantes',
              active: pathname === '/ajustes/globales/fabricantes',
            },
            {
              href: '/ajustes/globales/proveedores',
              label: 'Proveedores',
              active: pathname === '/ajustes/globales/proveedores',
            },
            {
              href: '/ajustes/globales/terceros',
              label: 'Terceros',
              active: pathname === '/ajustes/globales/terceros',
            },
            {
              href: '/ajustes/globales/clientes',
              label: 'Clientes',
              active: pathname === '/ajustes/globales/clientes',
            },
            {
              href: '/ajustes/globales/condiciones',
              label: 'Condiciones',
              active: pathname === '/ajustes/globales/condiciones',
            },
            {
              href: "/ajustes/globales/fuentes_informacion",
              label: "Fuentes de Informacion",
              active: pathname === "/ajustes/globales/fuentes_informacion",
              roles: ["JEFE_SMS", "ANALISTA_SMS", "SUPERUSER"],
            },
          ],
        },
        {
          href: '/ajustes/bancos_cuentas',
          label: 'Bancos',
          active: pathname.includes('/bancos_cuentas'),
          icon: Landmark,
          roles: ['SUPERUSER', 'ANALISTA_ADMINISTRACION', 'JEFE_ADMINISTRACION'],
          submenus: [
            {
              href: '/ajustes/bancos_cuentas/bancos',
              label: 'Bancos',
              active: pathname === '/ajustes/bancos_cuentas/bancos',
            },
            {
              href: '/ajustes/bancos_cuentas/cuentas',
              label: 'Cuentas',
              active: pathname === '/ajustes/bancos_cuentas/cuentas',
            },
            {
              href: '/ajustes/bancos_cuentas/tarjetas',
              label: 'Tarjetas',
              active: pathname === '/ajustes/bancos_cuentas/tarjetas',
            },
          ],
        },
        {
          href: '/ajustes/cuenta',
          label: 'Cuenta',
          active: pathname.includes('/ajustes/cuenta'),
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
          active: pathname.includes('/sistema/modulos'),
          icon: Blocks,
          roles: ['ADMIN', 'SUPERUSER'],
          submenus: [],
        },
        {
          href: '/sistema/usuarios_permisos',
          label: 'Usuarios Y Permisos',
          active: pathname.includes('/sistema/usuarios_permisos'),
          icon: User2,
          roles: ['ADMIN', 'SUPERUSER'],
          submenus: [
            {
              href: '/sistema/usuarios_permisos/usuarios',
              label: 'Administrar Usuarios',
              active: pathname === '/sistema/usuarios_permisos/usuarios',
            },
            {
              href: '/sistema/usuarios_permisos/roles',
              label: 'Administrar Roles',
              active: pathname === '/sistema/usuarios_permisos/roles',
            },
            // {
            //   href: '/sistema/usuarios_permisos/permisos',
            //   label: 'Administrar Permisos',
            //   active: pathname === '/sistema/usuarios_permisos/permisos',
            // },
          ],
        },
        {
          href: '/sistema/empresas/',
          label: 'Empresas',
          active: pathname.includes('/sistema/empresas/'),
          icon: Building2,
          roles: ['ADMIN', 'SUPERUSER'],
          submenus: [
            {
              href: '/sistema/empresas/empresas',
              label: 'Administrar Empresas',
              active: pathname === '/sistema/empresas/empresas',
            },
            {
              href: '/sistema/empresas/almacenes',
              label: 'Administrar Almacenes',
              active: pathname === '/sistema/empresas/almacenes',
            },
            {
              href: '/sistema/empresas/talleres',
              label: 'Administrar Talleres',
              active: pathname === '/sistema/empresas/talleres',
            },
            {
              href: '/sistema/empresas/ubicaciones',
              label: 'Administrar Ubicaciones',
              active: pathname === '/sistema/empresas/ubicaciones',
            },
            {
              href: '/sistema/empresas/empleados',
              label: 'Administrar Empleados',
              active: pathname === '/sistema/empresas/empleados',
            },
            {
              href: '/sistema/empresas/cargos',
              label: 'Administrar Cargos',
              active: pathname === '/sistema/empresas/cargos',
            },
            {
              href: '/sistema/empresas/departamentos',
              label: 'Administrar Departamentos',
              active: pathname === '/sistema/empresas/departamentos',
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
