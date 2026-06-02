import { Company } from '@/types';
import { LucideIcon } from 'lucide-react';
import { AdministrationMenuGroup } from './menu-list/administration';
import { AjustesMenuGroup } from './menu-list/ajustes';
import { AlmacenMenuGroup } from './menu-list/almacen';
import { CargaAdministrativaMenuGroup } from './menu-list/carga-administrativa';
import { DashboardMenuGroup } from './menu-list/dashboard';
import { DevelopmentMenuGroup } from './menu-list/development';
import { EngineeringMenuGroup } from './menu-list/engineering';
import { GeneralMenuGroup } from './menu-list/general';
import { PlanificationMenuGroup } from './menu-list/planification';
import { PurchasesMenuGroup } from './menu-list/purchases';
import { SistemaMenuGroup } from './menu-list/sistema';
import { SmsMenuGroup } from './menu-list/sms';

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

export type NavGroup = {
  groupLabel: string;
  moduleValue?: string;
  menus: Menu[];
};

export type NavGroupMake = (ctx: { companyPath: (path: string) => string }) => NavGroup;

const SUPERUSER_ROLES = ['SUPERUSER'];

export function getMenuList(currentCompany: Company | null, userRoles: string[]): NavGroup[] {
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

  const ctx = { companyPath };

  const fullMenu: NavGroup[] = [
    DashboardMenuGroup(ctx),
    GeneralMenuGroup(ctx),
    DevelopmentMenuGroup(ctx),
    AdministrationMenuGroup(ctx),
    SmsMenuGroup(ctx),
    PurchasesMenuGroup(ctx),
    CargaAdministrativaMenuGroup(ctx),
    AlmacenMenuGroup(ctx),
    PlanificationMenuGroup(ctx),
    EngineeringMenuGroup(ctx),
    AjustesMenuGroup(ctx),
    SistemaMenuGroup(ctx),
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
