'use client';

import { ChevronDown, LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { SidebarMenuButton } from '../ui/sidebar';
import { motion } from 'motion/react';

const AnimatedChevronDown = motion(ChevronDown);

export function LeafItem({
  href,
  label,
  Icon,
  active,
  collapsed,
  chevron,
  open,
  ...rest
}: {
  href?: string;
  label: string;
  Icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  chevron?: boolean;
  open?: boolean;
}) {
  const buttonClassName = cn(
    'rounded-xl h-auto min-h-11 px-3 py-2.5',
    active &&
      'relative border border-sidebar-border/70 bg-sidebar-accent/60 pl-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-1 before:rounded-full before:bg-sky-500',
  );

  const iconClassname = cn('flex items-center justify-center');
  const content2 = (
    <>
      <span className={iconClassname}>
        <Icon size={18} />
      </span>

      <span className="min-w-0 flex-1 max-w-[200px] truncate">{label}</span>
      {chevron && <AnimatedChevronDown size={18} className="ml-auto" animate={{ rotate: open ? '0deg' : '-90deg' }} />}
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
