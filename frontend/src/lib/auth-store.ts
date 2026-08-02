"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@restaurant-inventory/shared";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  restaurantId: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export function landingPathForRole(role: Role) {
  return role === "STAFF" ? "/sales" : "/dashboard";
}

function setAuthedCookie(authed: boolean) {
  if (typeof document === "undefined") return;
  if (authed) {
    document.cookie = "isAuthed=1; path=/; max-age=604800; samesite=lax";
  } else {
    document.cookie = "isAuthed=; path=/; max-age=0; samesite=lax";
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => {
        setAuthedCookie(true);
        set({ token, user });
      },
      logout: () => {
        setAuthedCookie(false);
        set({ token: null, user: null });
      },
    }),
    { name: "restaurant-inventory-auth" },
  ),
);
