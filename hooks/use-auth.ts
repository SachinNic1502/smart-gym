/**
 * Authentication Hook
 */

"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { authApi, ApiError } from "@/lib/api/client";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  memberLogin: (phone: string, otp?: string) => Promise<{ success: boolean; otpSent?: boolean; devOtp?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useAuthProvider(): AuthContextValue {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Check session on mount
  useEffect(() => {
    refreshSession();
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const response = await authApi.getSession();
      setState({ user: response.user, loading: false, error: null });
    } catch {
      setState({ user: null, loading: false, error: null });
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await authApi.login(email, password);
      setState({ user: response.user, loading: false, error: null });
      router.push(response.redirectUrl);
      return true;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Login failed";
      setState(prev => ({ ...prev, loading: false, error: message }));
      return false;
    }
  }, [router]);

  const memberLogin = useCallback(async (
    phone: string, 
    otp?: string
  ): Promise<{ success: boolean; otpSent?: boolean; devOtp?: string }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await authApi.memberLogin(phone, otp);
      
      if (response.user) {
        setState({ user: response.user, loading: false, error: null });
        router.push(response.redirectUrl || "/portal/dashboard");
        return { success: true };
      }
      
      // OTP was sent
      setState(prev => ({ ...prev, loading: false }));
      return { success: true, otpSent: true, devOtp: response.devOtp };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Login failed";
      setState(prev => ({ ...prev, loading: false, error: message }));
      return { success: false };
    }
  }, [router]);

 const logout = useCallback(async () => {
  try {
    await authApi.logout();   // calls /api/auth/logout
  } finally {
    setState({ user: null, loading: false, error: null });
    router.push("/login");
  }
}, [router]);

  return {
    ...state,
    login,
    memberLogin,
    logout,
    refreshSession,
  };
}

export { AuthContext };
