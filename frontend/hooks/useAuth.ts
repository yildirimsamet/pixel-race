import { useState, useEffect, useCallback } from "react";
import { users } from "@/lib/api";
import { User } from "@/types";
import { ApiError } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useWallet } from "@solana/wallet-adapter-react";

interface UseAuthReturn {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { disconnect } = useWallet();

  const fetchUser = useCallback(async () => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const userData = await users.getMe();
      setUser(userData);
      setIsLoggedIn(true);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : "Failed to fetch user";

      if (err instanceof ApiError && err.statusCode === 401) {
        setIsLoggedIn(false);
        setUser(null);
        setError(null);
        disconnect();
      } else {
        setError(errorMessage);
        setIsLoggedIn(false);
        setUser(null);
        disconnect();

        if (errorMessage !== "Unauthorized") {
          toast.error("Session expired. Please connect your wallet again.");
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsLoggedIn(false);
    setError(null);
    disconnect();
  }, []);

  useEffect(() => {
    fetchUser();

    const handleUserLogin = async () => {
      await fetchUser();
    };

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener("auth:login", handleUserLogin);
    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("auth:login", handleUserLogin);
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [fetchUser, logout]);

  return { user, isLoggedIn, loading, error, refetch: fetchUser, logout };
}
