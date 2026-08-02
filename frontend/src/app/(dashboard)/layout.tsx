"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { useAuthStore } from "@/lib/auth-store";

// Every page under this layout is authenticated, per-user state — never
// statically prerenderable.
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  // zustand's persist() rehydrates from localStorage synchronously on mount,
  // so a plain "did we mount in the browser yet" flag is enough — and unlike
  // calling useAuthStore.persist.hasHydrated() directly in render, this never
  // touches the persist API during SSR/build, where it isn't available.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (mounted && !token) {
      router.replace("/login");
    }
  }, [mounted, token, router]);

  if (!mounted || !token) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-x-hidden bg-muted/30 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
