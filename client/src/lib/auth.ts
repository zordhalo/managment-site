import { User } from "./types";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  UserCredential
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// Local storage key for user data
const USER_KEY = "booking_system_user";

// Save user data to local storage
export const saveUser = (user: User) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Remove auth data from local storage
export const clearAuth = () => {
  localStorage.removeItem(USER_KEY);
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
  return auth.currentUser !== null && !!getUser();
};

// Login
export const login = async (email: string, password: string): Promise<User> => {
  const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // Get additional user data from Firestore
  const userDocRef = doc(db, "users", userCredential.user.uid);
  const userDoc = await getDoc(userDocRef);
  
  if (!userDoc.exists()) {
    throw new Error("User data not found");
  }
  
  const userData = userDoc.data();
  const user: User = {
    id: userCredential.user.uid,
    username: userData.username,
    email: userCredential.user.email || "",
    fullName: userData.fullName,
    role: userData.role,
    phone: userData.phone
  };
  
  saveUser(user);
  return user;
};

// Register
export const register = async (userData: {
  username: string;
  password: string;
  email: string;
  fullName: string;
  phone?: string;
  role: "player" | "employee" | "supervisor";
}): Promise<User> => {
  // Create user with email and password
  const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
  
  // Store additional user data in Firestore
  const userDocRef = doc(db, "users", userCredential.user.uid);
  const userProfile = {
    username: userData.username,
    fullName: userData.fullName,
    role: userData.role,
    phone: userData.phone || null,
    createdAt: new Date()
  };
  
  await setDoc(userDocRef, userProfile);
  
  const user: User = {
    id: userCredential.user.uid,
    email: userData.email,
    username: userData.username,
    fullName: userData.fullName,
    role: userData.role,
    phone: userData.phone
  };
  
  return user;
};

// Logout
export const logout = async () => {
  await signOut(auth);
  clearAuth();
  // Redirect to login page can be done by components using this function
};

// Check if user has required role
export const hasRole = (requiredRoles: string[]): boolean => {
  const user = getUser();
  if (!user) return false;
  return requiredRoles.includes(user.role);
};
