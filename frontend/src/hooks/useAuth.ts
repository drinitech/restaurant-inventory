"use client";

import { useMutation } from "@tanstack/react-query";
import type { LoginInput, RegisterInput } from "@restaurant-inventory/shared";
import { api } from "@/lib/api-client";
import { useAuthStore, type AuthUser } from "@/lib/auth-store";

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (input: LoginInput) => api.post<AuthResponse>("/auth/login", input),
    onSuccess: (data) => setSession(data.token, data.user),
  });
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (input: RegisterInput) => api.post<AuthResponse>("/auth/register", input),
    onSuccess: (data) => setSession(data.token, data.user),
  });
}
