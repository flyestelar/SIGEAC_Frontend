import { CalendarClock, ClipboardCheck, Gauge, Hourglass, Plane, ScrollText, Wrench } from 'lucide-react';
import { NavGroupMake } from '../menu-list';

export const PlanificationMenuGroup: NavGroupMake = ({ companyPath }) => ({
  groupLabel: 'Planificación',
  moduleValue: 'planification',
  menus: [
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
      href: companyPath('/planificacion/ordenes_trabajo'),
      label: 'Ordenes de Trabajo',
      icon: ClipboardCheck,
      roles: ['ANALISTA_PLANIFICACION', 'JEFE_PLANIFICACION', 'SUPERUSER'],
      submenus: [],
    },
    {
      href: companyPath('/planificacion/alertas'),
      label: 'Alertas de Vencimiento',
      icon: CalendarClock,
      roles: ['ANALISTA_PLANIFICACION', 'JEFE_PLANIFICACION', 'SUPERUSER'],
      submenus: [],
    },
    {
      href: companyPath('/planificacion/control_vuelos'),
      label: 'Ctrl. de Hrs. de Vuelo',
      icon: Gauge,
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
      href: companyPath('/planificacion/control_mantenimiento'),
      label: 'Ctrl. de Mantenimiento',
      icon: Wrench,
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
      href: companyPath('/planificacion/directivas'),
      label: 'Directivas de Aeronavegabilidad',
      icon: ScrollText,
      roles: ['ANALISTA_PLANIFICACION', 'JEFE_PLANIFICACION', 'SUPERUSER'],
      submenus: [],
    },
  ],
});
