import { cn } from "@/lib/utils";

interface ContentLayoutProps {
  /**
   * @deprecated The `title` prop is no longer used. The breadcrumb is now
   * generated dynamically based on the current route and the menu-list
   */
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function ContentLayout({ children, className }: ContentLayoutProps) {
  return <div className={cn("container grow px-4 pb-8 pt-6 sm:px-6", className)}>{children}</div>;
}
