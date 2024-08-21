'use client'

import { SheetMenu } from "@/components/sidebar/SheetMenu";
import { UserNav } from "@/components/layout/UserNav";
import { useCompanyStore } from "@/stores/CompanyStore";
import { ThemeToggler } from "./ThemeToggler";
import CompanySelect from "../selects/CompanySelect";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {

  const {user, loading} = useAuth();

  return (
    <header className="sticky top-0 z-10 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary">
      <div className="mx-4 sm:mx-8 flex h-14 items-center justify-center">
        <div className="flex flex-1 items-center space-x-4 lg:space-x-0">
          <SheetMenu />
          <h1 className="font-bold">{title}</h1>
        </div>
        <CompanySelect />
        <div className="flex flex-1 items-center space-x-2 justify-end">
          <ThemeToggler />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
