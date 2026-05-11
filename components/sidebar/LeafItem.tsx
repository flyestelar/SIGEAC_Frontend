'use client';

import { ChevronDown, LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { SidebarMenuButton } from '../ui/sidebar';

export function LeafItem({
  href,
  label,
  Icon,
  active,
  collapsed,
  chevron,
  ...rest
}: {
  href?: string;
  label: string;
  Icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  chevron?: boolean;
}) {
  const buttonClassName = cn(collapsed && 'mx-auto');

  const iconClassname = cn('flex items-center justify-center', !collapsed && ' p-1 rounded-md bg-muted-foreground/10');
  const content2 = (
    <>
      <span className={iconClassname}>
        <Icon size={18} />
      </span>

      <span className="min-w-0 flex-1 max-w-[200px] truncate">{label}</span>
      {chevron && (
        <ChevronDown
          size={18}
          className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
        />
      )}
    </>
  );

  const content = href ? (
    <SidebarMenuButton {...rest} isActive={active} asChild className={buttonClassName}>
      <Link href={href} aria-current={active ? 'page' : undefined}>
        {content2}
      </Link>
    </SidebarMenuButton>
  ) : (
    <SidebarMenuButton {...rest} isActive={active} className={buttonClassName}>
      {content2}
    </SidebarMenuButton>
  );

  if (!collapsed) return content;

  return (
    <Tooltip delayDuration={80}>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right">
        <p className="text-sm">{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
