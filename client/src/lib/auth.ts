import { AuthResponse, User } from "./types";
import { apiRequest } from "./queryClient";

// Local storage keys
const TOKEN_KEY = "booking_system_token";
const USER_KEY = "booking_system_user";

// Save auth data to local storage
export const saveAuth = (data: AuthResponse) => {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
};

// Remove auth data from local storage
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Get token from local storage
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Get user from local storage
export const getUser = (): User | null => {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  
  try {
    return JSON.parse(userJson) as User;
  } catch {
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken() && !!getUser();
};

// Login
export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await apiRequest("POST", "/api/auth/login", { username, password });
  const data = await response.json();
  saveAuth(data);
  return data;
};

// Register
export const register = async (userData: {
  username: string;
  password: string;
  email: string;
  fullName: string;
  phone?: string;
  role: "player" | "employee" | "supervisor";
}) => {
  const response = await apiRequest("POST", "/api/auth/register", userData);
  return response.json();
};

// Logout
export const logout = () => {
  clearAuth();
  // Redirect to login page can be done here or by components using this function
};

// Check if user has required role
export const hasRole = (requiredRoles: string[]): boolean => {
  const user = getUser();
  if (!user) return false;
  return requiredRoles.includes(user.role);
};
