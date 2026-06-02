interface ContentLayoutProps {
  /**
   * @deprecated The `title` prop is no longer used. The breadcrumb is now
   * generated dynamically based on the current route and the menu-list
   */
  title?: string;
  children: React.ReactNode;
}

export function ContentLayout({ children }: ContentLayoutProps) {
  return <div className="container px-4 pb-8 pt-6 sm:px-6">{children}</div>;
}
