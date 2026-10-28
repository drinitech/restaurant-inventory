"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { landingPathForRole, useAuthStore } from "@/lib/auth-store";

/**
 * The landing page is public, but signed-in users should go straight to the app.
 * The role only lives in the client-side store, so this can't be done in proxy.ts.
 */
export function RedirectIfSignedIn() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  React.useEffect(() => {
    if (token && user) router.replace(landingPathForRole(user.role));
  }, [token, user, router]);

  return null;
}
