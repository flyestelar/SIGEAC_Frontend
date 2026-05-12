"use client";

import ProtectedLayout from "@/components/layout/ProtectedLayout";

export default function GlobalesSmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedLayout roles={["SUPERUSER", "ANALISTA_SMS", "JEFE_SMS"]}>
      {children}
    </ProtectedLayout>
  );
}
