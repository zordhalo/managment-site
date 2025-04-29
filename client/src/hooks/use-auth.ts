import { useEffect, useState } from "react";
import { User } from "@/lib/types";
import { 
  getUser, 
  saveUser,
  clearAuth,
  login as authLogin, 
  logout as authLogout,
  register as authRegister
} from "@/lib/auth";
import { useLocation } from "wouter";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(getUser());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Set up Firebase auth state change listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        try {
          // Get additional user data from Firestore
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userObj: User = {
              id: firebaseUser.uid,
              username: userData.username,
              email: firebaseUser.email || "",
              fullName: userData.fullName,
              role: userData.role,
              phone: userData.phone
            };
            
            saveUser(userObj);
            setUser(userObj);
          } else {
            // Handle case where user auth exists but no profile found
            console.error("User authenticated but no profile found");
            clearAuth();
            setUser(null);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          clearAuth();
          setUser(null);
        }
      } else {
        // Not authenticated
        clearAuth();
        setUser(null);
      }
      
      setLoading(false);
    });
    
    // Clean up subscription
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const user = await authLogin(email, password);
      setUser(user);
      
      // Redirect based on user role
      if (user.role === "player") {
        setLocation("/player/booking");
      } else if (user.role === "employee") {
        setLocation("/employee/dashboard");
      } else if (user.role === "supervisor") {
        setLocation("/supervisor/dashboard");
      }
      
      return user;
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
      const user = await authRegister(userData);
      setLocation("/login");
      return user;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authLogout();
      setUser(null);
      setLocation("/login");
    } catch (err) {
      console.error("Error during logout:", err);
    }
  };

  const checkAuth = () => {
    return !!auth.currentUser && !!user;
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
