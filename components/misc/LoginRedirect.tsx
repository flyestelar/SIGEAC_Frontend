"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface LoginRedirectProps {
  redirectTo?: string;
}

export const LoginRedirect = ({ redirectTo }: LoginRedirectProps) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(redirectTo ?? '/inicio');
    }
  }, [isAuthenticated, loading, redirectTo, router]);

  return null;
};
