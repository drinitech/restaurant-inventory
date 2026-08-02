"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChangePasswordInput, UpdateProfileInput } from "@restaurant-inventory/shared";
import { api } from "@/lib/api-client";
import { useAuthStore, type AuthUser } from "@/lib/auth-store";

export function useMyProfile() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => api.get<AuthUser>("/auth/me"),
    enabled: !!token,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => api.put<AuthUser>("/auth/me", input),
    onSuccess: (user) => {
      setUser(user);
      qc.setQueryData(["profile", "me"], user);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => api.put<void>("/auth/me/password", input),
  });
}
