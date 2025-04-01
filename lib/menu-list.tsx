import {
  Banknote,
  BookUser,
  Boxes,
  Building,
  ClipboardCopy,
  CreditCard,
  CreditCardIcon,
  Globe,
  HandCoins,
  Landmark,
  LayoutGrid,
  LucideIcon,
  Map,
  PackageOpen,
  PackagePlus,
  PackageSearch,
  Plane,
  PlaneIcon,
  PlaneLanding,
  PlaneLandingIcon,
  PlaneTakeoff,
  Receipt,
  ScrollText,
  Settings,
  ShoppingCart,
  SquarePen,
  Timer,
  User2,
  Wrench,
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active: boolean;
};

type Menu = {
  href: string;
  label: string;
  active: boolean;
  icon: LucideIcon;
  roles: string[];
  submenus: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export type CompanyMenu = "transmandu" | "hangar 74";

//TODO: Crear menus para cada empresa. Mismo array o diferente, ir probando.

export function getMenuList(
  pathname: string,
  company: CompanyMenu,
  userRoles: string[]
): Group[] {
  function hasAccess(menu: Menu): boolean {
    return (
      menu.roles.length === 0 ||
      menu.roles.some((role) => userRoles.includes(role))
    );
  }

  return (
    company === "transmandu"
      ? [
          {
            groupLabel: "",
            menus: [
              {
                href: "/transmandu/dashboard",
                label: "Dashboard",
                active: pathname.includes("/transmandu/dashboard"),
                icon: LayoutGrid,
                roles: [],
                submenus: [],
              },
            ],
          },
          {
            groupLabel: "Administración",
            menus: [
              {
                href: "/transmandu/administracion/operaciones",
                label: "Operanciones",
                active: pathname.includes(
                  "/transmandu/administracion/operaciones"
                ),
                icon: BookUser,
                roles: [
                  "ANALISTA_PLANIFICACION",
                  "JEFE_PLANIFICACION",
                  "SUPERUSER",
                ],
                submenus: [
                  {
                    href: "/transmandu/administracion/operaciones/renta",
                    label: "Renta",
                    active:
                      pathname ===
                      "/transmandu/administracion/operaciones/renta",
                  },
                  {
                    href: "/transmandu/administracion/operaciones/ventas",
                    label: "Ventas",
                    active:
                      pathname ===
                      "/transmandu/administracion/operaciones/ventas",
                  },
                  {
                    href: "/transmandu/administracion/operaciones/articulos",
                    label: "Artículos",
                    active:
                      pathname ===
                      "/transmandu/administracion/operaciones/articulos",
                  },
                ],
              },
              // {
              //   href: "/transmandu/administracion/pagos",
              //   label: "Pagos",
              //   active: pathname.includes("/transmandu/administracion/pagos"),
              //   icon: CreditCard,
              //   roles: [
              //     "ANALISTA_PLANIFICACION",
              //     "JEFE_PLANIFICACION",
              //     "SUPERUSER",
              //   ],
              //   submenus: [],
              // },
              {
                href: "/transmandu/administracion/gestion_vuelos",
                label: "Gestión de Vuelos",
                active: pathname.includes(
                  "/transmandu/administracion/gestion_vuelos"
                ),
                icon: PlaneIcon,
                roles: [
                  "ANALISTA_PLANIFICACION",
                  "JEFE_PLANIFICACION",
                  "SUPERUSER",
                ],
                submenus: [
                  {
                    href: "/transmandu/administracion/gestion_vuelos/aviones",
                    label: "Aeronaves",
                    active:
                      pathname ===
                      "/transmandu/administracion/gestion_vuelos/aviones",
                  },
                  {
                    href: "/transmandu/administracion/gestion_vuelos/rutas",
                    label: "Rutas",
                    active:
                      pathname ===
                      "/transmandu/administracion/gestion_vuelos/rutas",
                  },
                  {
                    href: "/transmandu/administracion/gestion_vuelos/vuelos",
                    label: "Vuelos",
                    active:
                      pathname ===
                      "/transmandu/administracion/gestion_vuelos/vuelos",
                  },
                ],
              },
              {
                href: "/transmandu/administracion/creditos",
                label: "Gestión de Créditos",
                active: pathname.includes(
                  "/transmandu/administracion/creditos"
                ),
                icon: CreditCardIcon,
                roles: [
                  "ANALISTA_PLANIFICACION",
                  "JEFE_PLANIFICACION",
                  "SUPERUSER",
                ],
                submenus: [
                  {
                    href: "/transmandu/administracion/creditos/credito_renta",
                    label: "Crédito de Rentas",
                    active:
                      pathname ===
                      "/transmandu/administracion/creditos/credito_renta",
                  },
                  {
                    href: "/transmandu/administracion/creditos/credito_venta",
                    label: "Crédito de Ventas",
                    active:
                      pathname ===
                      "/transmandu/administracion/creditos/credito_venta",
                  },
                  {
                    href: "/transmandu/administracion/creditos/credito_vuelo",
                    label: "Crédito de Vuelos",
                    active:
                      pathname ===
                      "/transmandu/administracion/creditos/credito_vuelo",
                  },
                ],
              },
              {
                href: "/transmandu/administracion/gestion_general",
                label: "Gestión General",
                active: pathname.includes(
                  "/transmandu/administracion/gestion_general"
                ),
                icon: BookUser,
                roles: [
                  "ANALISTA_PLANIFICACION",
                  "JEFE_PLANIFICACION",
                  "SUPERUSER",
                ],
                submenus: [
                  {
                    href: "/transmandu/administracion/gestion_general/empresa",
                    label: "Gestionar Empresa",
                    active:
                      pathname ===
                      "/transmandu/administracion/gestion_general/empresa",
                  },
                  {
                    href: "/transmandu/administracion/gestion_general/proveedor",
                    label: "Gestionar Proveedor",
                    active:
                      pathname ===
                      "/transmandu/administracion/gestion_general/proveedor",
                  },
                  {
                    href: "/transmandu/administracion/gestion_general/clientes",
                    label: "Gestionar Clientes",
                    active:
                      pathname ===
                      "/transmandu/administracion/gestion_general/clientes",
                  },
                ],
              },
              {
                href: "/transmandu/administracion/gestion_cajas",
                label: "Finanzas",
                active: pathname.includes(
                  "/transmandu/administracion/gestion_cajas"
                ),
                icon: Landmark,
                roles: [
                  "ANALISTA_PLANIFICACION",
                  "JEFE_PLANIFICACION",
                  "SUPERUSER",
                ],
                submenus: [
                  {
                    href: "/transmandu/administracion/gestion_cajas/cuentas",
                    label: "Cajas",
                    active:
                      pathname ===
                      "/transmandu/administracion/gestion_cajas/cuentas",
                  },
                  {
                    href: "/transmandu/administracion/gestion_cajas/movimientos",
                    label: "Movimientos",
                    active:
                      pathname ===
                      "/transmandu/administracion/gestion_cajas/movimientos",
                  },
                ],
              },
            ],
          },
          {
            groupLabel: "Sistema",
            menus: [
              {
                href: "/sistema/usuarios_permisos",
                label: "Usuarios Y Permisos",
                active: pathname.includes("/sistema/usuarios_permisos"),
                icon: User2,
                roles: ["ADMIN", "SUPERUSER"],
                submenus: [
                  {
                    href: "/sistema/usuarios_permisos/usuarios",
                    label: "Administrar Usuarios",
                    active: pathname === "/sistema/usuarios_permisos/usuarios",
                  },
                  {
                    href: "/sistema/usuarios_permisos/roles",
                    label: "Administrar Roles",
                    active: pathname === "/sistema/usuarios_permisos/roles",
                  },
                  {
                    href: "/sistema/usuarios_permisos/permisos",
                    label: "Administrar Permisos",
                    active: pathname === "/sistema/usuarios_permisos/permisos",
                  },
                ],
              },
            ],
          },
          {
            groupLabel: "Ajustes",
            menus: [
              {
                href: "/ajustes/empresas",
                label: "Globales",
                active: pathname.includes("/ajustes/globales"),
                icon: Globe,
                roles: ["SUPERUSER"],
                submenus: [
                  {
                    href: "/ajustes/globales/bancos",
                    label: "Bancos",
                    active: pathname === "/ajustes/globales/bancos",
                  },
                  {
                    href: "/ajustes/globales/cuentas_bancos",
                    label: "Cuentas",
                    active: pathname === "/ajustes/globales/bancos",
                  },
                  {
                    href: "/ajustes/globales/tarjetas_bancos",
                    label: "Tarjetas",
                    active: pathname === "/ajustes/globales/bancos",
                  },
                  {
                    href: "/ajustes/globales/unidades",
                    label: "Unidades",
                    active: pathname === "/ajustes/globales/unidades",
                  },
                  {
                    href: "/ajustes/globales/fabricantes",
                    label: "Fabricantes",
                    active: pathname === "/administracion/globales/fabricantes",
                  },
                  {
                    href: "/ajustes/globales/proveedores",
                    label: "Proveedores",
                    active: pathname === "/administracion/globales/proveedores",
                  },
                  {
                    href: "/ajustes/globales/condiciones",
                    label: "Condiciones",
                    active: pathname === "/ajustes/globales/condiciones",
                  },
                ],
              },
              {
                href: "/ajustes/cuentas_bancos",
                label: "Cuentas y Bancos",
                active: pathname.includes("/ajustes"),
                icon: Banknote,
                roles: [],
                submenus: [],
              },
              {
                href: "/hangar74/cuenta",
                label: "Cuenta",
                active: pathname.includes("/cuenta"),
                icon: Settings,
                roles: [],
                submenus: [],
              },
            ],
          },
          {
            groupLabel: "Settings",
            menus: [
              {
                href: "/cuenta",
                label: "Cuenta",
                active: pathname.includes("/cuenta"),
                icon: Settings,
                roles: [],
                submenus: [],
              },
            ],
          },
        ]
      : [
          {
            groupLabel: "",
            menus: [
              {
                href: "/hangar74/dashboard",
                label: "Dashboard / Hangar74",
                active: pathname.includes("/hangar74/dashboard"),
                icon: LayoutGrid,
                roles: [],
                submenus: [],
              },
            ],
          },
          {
            groupLabel: "General",
            menus: [
              {
                href: "/hangar74/general/inventario",
                label: "Inventario",
                active: pathname.includes("/hangar74/general/inventario"),
                icon: PackageSearch,
                roles: [],
                submenus: [],
              },
              {
                href: "/hangar74/general/requisiciones",
                label: "Requisiciones",
                active: pathname.includes("/hangar74/general/requisiciones"),
                icon: ScrollText,
                roles: [],
                submenus: [],
              },
            ],
          },
          {
            groupLabel: "Carga Administrativa",
            menus: [
              {
                href: "",
                label: "Control de Ingreso",
                active: pathname.includes(
                  "/hangar74/almacen/inventario/ingreso"
                ),
                icon: PackagePlus,
                roles: ["ANALISTA_ALMACEN", "ANALISTA_COMPRAS", "SUPERUSER"],
                submenus: [
                  {
                    href: "/hangar74/almacen/ingreso/registrar_ingreso",
                    label: "Ingreso de Articulo",
                    active:
                      pathname ===
                      "/hangar74/almacen/ingreso/registrar_ingreso",
                  },
                  // {
                  //   href: "/hangar74/almacen/ingreso/en_transito",
                  //   label: "Articulos en Tránsito",
                  //   active: pathname === "/hangar74/almacen/ingreso/en_transito"
                  // },
                  // {
                  //   href: "/hangar74/almacen/ingreso/en_recepcion",
                  //   label: "Articulos en Recepción",
                  //   active: pathname === "/hangar74/almacen/ingreso/en_recepcion"
                  // },
                ],
              },
            ],
          },
          {
            groupLabel: "Almacen",
            menus: [
              {
                href: "",
                label: "Solicitudes",
                active: pathname.includes("/hangar74/almacen/solicitudes"),
                icon: ClipboardCopy,
                roles: ["ANALISTA_ALMACEN", "JEFE_ALMACEN", "SUPERUSER"],
                submenus: [
                  {
                    href: "/hangar74/almacen/solicitudes/pendiente",
                    label: "Pendiente",
                    active:
                      pathname === "/hangar74/almacen/solicitudes/pendiente",
                  },
                  {
                    href: "/hangar74/almacen/solicitudes/salida",
                    label: "Salida",
                    active: pathname === "/hangar74/almacen/solicitudes/salida",
                  },
                ],
              },
              {
                href: "/hangar74/almacen/inventario",
                label: "Inventario",
                active: pathname.includes("/hangar74/almacen/inventario"),
                icon: PackageOpen,
                roles: ["ANALISTA_ALMACEN", "JEFE_ALMACEN", "SUPERUSER"],
                submenus: [
                  {
                    href: "/hangar74/almacen/inventario/gestion",
                    label: "Gestión",
                    active:
                      pathname === "/hangar74/almacen/inventario/gestion" ||
                      pathname === "/hangar74/almacen/inventario/gestion/crear",
                  },
                  {
                    href: "/hangar74/almacen/inventario/entregado",
                    label: "Entregado",
                    active:
                      pathname === "/hangar74/almacen/inventario/entregado",
                  },
                ],
              },
              {
                href: "/hangar74/almacen/caja_herramientas",
                label: "Cajas de Herramientas",
                roles: ["ANALISTA_ALMACEN", "JEFE_ALMACEN", "SUPERUSER"],
                active: pathname.includes(
                  "/hangar74/almacen/caja_herramientas"
                ),
                icon: Wrench,
                submenus: [],
              },
            ],
          },
          {
            groupLabel: "Compras",
            menus: [
              {
                href: "/hangar74/compras/cotizaciones",
                label: "Cotizaciones",
                active: pathname.includes("/hangar74/compras/cotizaciones"),
                icon: HandCoins,
                roles: ["ANALISTA_COMPRAS", "JEFE_COMPRAS", "SUPERUSER"],
                submenus: [],
              },
              {
                href: "/hangar74/compras/ordenes_compra",
                label: "Ordenes de Compra",
                active: pathname.includes("/hangar74/compras/ordenes_compra"),
                icon: Receipt,
                roles: ["ANALISTA_COMPRAS", "JEFE_COMPRAS", "SUPERUSER"],
                submenus: [],
              },
              // {
              //   href: "/hangar74/compras/reportes",
              //   label: "Reporte de Compras",
              //   active: pathname.includes("/hangar74/compras/reportes"),
              //   icon: NotebookPen,
              //   roles: ["ANALISTA_COMPRAS", "JEFE_COMPRAS", "SUPERUSER"],
              //   submenus: [
              //     {
              //       href: "/hangar74/compras/reportes/general",
              //       label: "Reporte General",
              //       active: pathname === "/hangar74/compras/reportes/general"
              //     },
              //     {
              //       href: "/hangar74/compras/reportes/aeronave",
              //       label: "Reporte de Aeronave",
              //       active: pathname === "/hangar74/compras/reportes/aeronave"
              //     },
              //     {
              //       href: "/hangar74/compras/reportes/proveedor",
              //       label: "Reporte de Proveedor",
              //       active: pathname === "/hangar74/compras/reportes/proveedor"
              //     },
              //   ]
              // },
            ],
          },
          {
            groupLabel: "Planificación y Mantenimiento",
            menus: [
              {
                href: "/hangar74/planificacion/ordenes_trabajo",
                label: "Ordenes de Trabajo",
                active: pathname.includes(
                  "/hangar74/planificacion/ordenes_trabajo"
                ),
                icon: SquarePen,
                roles: [
                  "ANALISTA_PLANIFICACION",
                  "JEFE_PLANIFICACION",
                  "SUPERUSER",
                ],
                submenus: [
                  {
                    href: "/hangar74/planificacion/ordenes_trabajo/",
                    label: "Gestionar Ordenes",
                    active:
                      pathname === "/hangar74/planificacion/ordenes_trabajo",
                  },
                ],
              },
              {
                href: "/hangar74/planificacion/aeronaves",
                label: "Aeronaves",
                active: pathname.includes("/hangar74/planificacion/reportes"),
                icon: Plane,
                roles: [
                  "ANALISTA_PLANIFICACION",
                  "JEFE_PLANIFICACION",
                  "SUPERUSER",
                ],
                submenus: [
                  {
                    href: "/hangar74/planificacion/aeronaves",
                    label: "Gestión de Aeronaves",
                    active: pathname === "/hangar74/planificacion/aeronaves",
                  },
                ],
              },
            ],
          },
          {
            groupLabel: "Ajustes",
            menus: [
              {
                href: "/ajustes/empresas",
                label: "Globales",
                active: pathname.includes("/ajustes/globales"),
                icon: Globe,
                roles: ["ANALISTA_ALMACEN", "JEFE_ALMACEN", "SUPERUSER"],
                submenus: [
                  {
                    href: "/ajustes/globales/unidades",
                    label: "Unidades",
                    active: pathname === "/ajustes/globales/unidades",
                  },
                  {
                    href: "/ajustes/globales/fabricantes",
                    label: "Fabricantes",
                    active: pathname === "/administracion/globales/fabricantes",
                  },
                  {
                    href: "/ajustes/globales/proveedores",
                    label: "Proveedores",
                    active: pathname === "/administracion/globales/proveedores",
                  },
                  {
                    href: "/ajustes/globales/condiciones",
                    label: "Condiciones",
                    active: pathname === "/ajustes/globales/condiciones",
                  },
                ],
              },
              {
                href: "/ajustes/bancos_cuentas",
                label: "Bancos y Cuentas",
                active: pathname.includes("/bancos_cuentas"),
                icon: Landmark,
                roles: ["SUPERUSER"],
                submenus: [
                  {
                    href: "/ajustes/bancos_cuentas/bancos",
                    label: "Bancos",
                    active: pathname === "/ajustes/bancos_cuentas/bancos",
                  },
                  {
                    href: "/ajustes/bancos_cuentas/cuentas",
                    label: "Cuentas",
                    active: pathname === "/ajustes/bancos_cuentas/cuentas",
                  },
                  {
                    href: "/ajustes/bancos_cuentas/tarjetas",
                    label: "Tarjetas",
                    active: pathname === "/ajustes/bancos_cuentas/tarjetas",
                  },
                ],
              },
            ],
          },
          {
            groupLabel: "Sistema",
            menus: [
              {
                href: "/sistema/usuarios_permisos",
                label: "Usuarios",
                active: pathname.includes("/sistema/usuarios_permisos"),
                icon: User2,
                roles: ["SUPERUSER"],
                submenus: [
                  {
                    href: "/sistema/usuarios_permisos/usuarios",
                    label: "Administrar Usuarios",
                    active: pathname === "/sistema/usuarios_permisos/usuarios",
                  },
                  {
                    href: "/sistema/usuarios_permisos/roles",
                    label: "Administrar  Roles",
                    active: pathname === "/sistema/usuarios_permisos/roles",
                  },
                  {
                    href: "/sistema/usuarios_permisos/permisos",
                    label: "Administrar Permisos",
                    active: pathname === "/sistema/usuarios_permisos/permisos",
                  },
                ],
              },
              {
                href: "/sistema/empresas",
                label: "Empresas",
                active: pathname.includes("/sistema/empresas"),
                icon: Building,
                roles: ["SUPERUSER"],
                submenus: [
                  {
                    href: "/sistema/empresas/almacenes",
                    label: "Administrar Almacenes",
                    active: pathname === "/sistema/empresas/almacenes",
                  },
                  {
                    href: "/sistema/empresas/empleados",
                    label: "Administrar Empleados",
                    active: pathname === "/sistema/empresas/empleados",
                  },
                ],
              },
            ],
          },
        ]
  )
    .map((group) => ({
      ...group,
      menus: group.menus.filter(hasAccess).map((menu) => ({
        ...menu,
        submenus: menu.submenus.filter(
          (sub) =>
            !menu.roles.length ||
            menu.roles.some((role) => userRoles.includes(role))
        ),
      })),
    }))
    .filter((group) => group.menus.length > 0);
}
