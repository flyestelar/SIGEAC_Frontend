'use client';

import { Menu } from '@/components/sidebar/Menu';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import Image from 'next/image';
import Link from 'next/link';
import { Sidebar, SidebarContent, SidebarHeader } from '../ui/sidebar';

export function AppSidebar() {
  const { selectedCompany, selectedStation } = useCompanyStore();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="pt-10 pb-6">
        <Link
          href={`/${selectedCompany?.slug}/dashboard`}
          className={cn('transition-transform ease-in-out duration-300 flex items-center justify-center gap-2 px-1')}
        >
          <Image src={'/images/logo.png'} width={150} height={150} alt="Logo" />
        </Link>
      </SidebarHeader>
      <SidebarContent className="relative">
        {selectedCompany && selectedStation ? (
          <Menu />
        ) : (
          <p className="text-sm text-muted-foreground text-center mt-10">
            Por favor, seleccione una <strong>Empresa</strong> y una <strong>Estacion</strong>.
          </p>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
