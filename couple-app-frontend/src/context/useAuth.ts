import { createContext, useContext } from "react";

/**
 * Defines the shape of the User object, which should match
 * the data structure returned by your backend API.
 */
export interface User {
  id: string;
  email: string;
  name: string;
  partnerName?: string;
  partnerEmail?: string;
  partnerProfilePictureUrl?: string;
  profile_picture_url?: string;
}

/**
 * Defines the shape of the authentication context. This includes
 * the user's state, loading status, and authentication functions.
 */
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>; // Add other fields if needed
  register: (email: string, password: string, full_name?: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

// Create the context with an undefined default value.
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Custom hook for consuming the authentication context.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};