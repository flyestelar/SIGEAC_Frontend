import { LayoutGrid } from 'lucide-react';
import { NavGroupMake } from '../menu-list';

export const DashboardMenuGroup: NavGroupMake = ({ companyPath }) => ({
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
});
