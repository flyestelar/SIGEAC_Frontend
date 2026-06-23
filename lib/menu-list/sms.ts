import { AreaChartIcon, CalendarClock, ClipboardCheck, ClipboardPen, Settings, ShieldAlert } from 'lucide-react';
import { NavGroupMake } from '../menu-list';

export const SmsMenuGroup: NavGroupMake = ({ companyPath }) => ({
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
    //   href: `/${currentCompany?.slug}/sms/certificados`,
    //   label: "Certificados",
    //   icon: Award,
    //   roles: ["SUPERUSER", "JEFE_SMS", "ANALISTA_SMS"],
    //   submenus: [],
    // },

    {
      href: companyPath('/sms/promocion'),
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
        //   href: `/${currentCompany?.slug}/sms/promocion/boletines`,
        //   label: "Boletines",
        //   roles: ["SUPERUSER", "JEFE_SMS", "ANALISTA_SMS"],
        // },
      ],
    },
    {
      href: companyPath('/sms/gestion_encuestas'),
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
      href: companyPath('/sms/ajustes'),
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
});
