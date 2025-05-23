"use client";

import { AuthProvider as AuthHookProvider } from "@/hooks/useAuth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthHookProvider>{children}</AuthHookProvider>;
}
