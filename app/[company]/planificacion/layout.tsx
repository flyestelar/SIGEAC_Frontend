"use client";
import ProtectedRoute from '@/components/layout/ProtectedRoute';

const ALLOWED_ROLES = ['ANALISTA_PLANIFICACION', 'JEFE_PLANIFICACION', 'SUPERUSER'];

export default function PlanificacionLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute roles={ALLOWED_ROLES}>{children}</ProtectedRoute>;
}
