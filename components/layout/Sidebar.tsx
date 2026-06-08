'use client';

import { Menu } from '@/components/sidebar/Menu';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import Image from 'next/image';
import Link from 'next/link';
import { Sidebar, SidebarContent, SidebarHeader, useSidebar } from '../ui/sidebar';
import CompanySelect from '../selects/CompanySelect';
import { NavGroup } from '@/lib/menu-list';

export function AppSidebar({ menuList }: { menuList: NavGroup[] }) {
  const sidebar = useSidebar();
  const { selectedCompany, selectedStation } = useCompanyStore();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="pt-10 pb-6 gap-4">
        <Link
          href={`/${selectedCompany?.slug}/dashboard`}
          className={cn('transition-transform ease-in-out duration-300 flex items-center justify-center gap-2 px-1')}
        >
          <Image loading='eager' src={'/images/logo.png'} width={150} height={150} alt="Logo" />
        </Link>
        {sidebar.isMobile && <CompanySelect />}
      </SidebarHeader>
      <SidebarContent className="relative">
        {selectedCompany && selectedStation ? (
          <Menu menuList={menuList} />
        ) : (
          <p className="text-sm text-muted-foreground text-center mt-10">
            Por favor, seleccione una <strong>Empresa</strong> y una <strong>Estacion</strong>.
          </p>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
