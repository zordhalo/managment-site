import { useEffect, useState } from "react";
import { User } from "@/lib/types";
import { 
  isAuthenticated, 
  getUser, 
  login as authLogin, 
  logout as authLogout,
  register as authRegister
} from "@/lib/auth";
import { useLocation } from "wouter";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(getUser());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Update user if auth state changes
    setUser(getUser());
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authLogin(username, password);
      setUser(response.user);
      
      // Redirect based on user role
      if (response.user.role === "player") {
        setLocation("/player/booking");
      } else if (response.user.role === "employee") {
        setLocation("/employee/dashboard");
      } else if (response.user.role === "supervisor") {
        setLocation("/supervisor/dashboard");
      }
      
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: {
    username: string;
    password: string;
    email: string;
    fullName: string;
    phone?: string;
    role: "player" | "employee" | "supervisor";
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authRegister(userData);
      setLocation("/login");
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authLogout();
    setUser(null);
    setLocation("/login");
  };

  const checkAuth = () => {
    const authenticated = isAuthenticated();
    if (!authenticated && user) {
      setUser(null);
    } else if (authenticated && !user) {
      setUser(getUser());
    }
    return authenticated;
  };

  return {
    user,
    login,
    logout,
    register,
    loading,
    error,
    checkAuth,
    isAuthenticated: !!user,
  };
};
