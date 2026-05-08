"use client";

import ProtectedLayout from "@/components/layout/ProtectedLayout";
import React from "react";

const FuentesInformacionLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProtectedLayout roles={["JEFE_SMS", "ANALISTA_SMS", "SUPERUSER"]}>
      {children}
    </ProtectedLayout>
  );
};

export default FuentesInformacionLayout;
