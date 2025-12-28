import React, { useState, useEffect, type ReactNode } from "react";
import axios from "axios";
import { AuthContext, type User } from "./useAuth";
import { api } from "../lib/api"; // Import the configured axios instance

// The AuthContext is defined in useAuth.ts, so we don't need to redefine it here.
// We are importing AuthContext from useAuth.ts and using it directly.
// This file should focus on providing the AuthProvider.
//
// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && token.trim() !== "") config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
const [user, setUser] = useState<User | null>(null);
const [loading, setLoading] = useState(true);


// Real app: validate token & fetch user profile
useEffect(() => {
const token = localStorage.getItem("token");
if (!token) {
setLoading(false);
return;
}


const validate = async () => {
try {
const res = await api.get("/auth/me"); // expects user profile
setUser(res.data);
} catch (err) {
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 401) {
      // This is an expected case when the token is expired or invalid.
      console.log("Invalid or expired token detected. Clearing session.");
    } else if (err.response?.status === 400) {
      console.error("Bad request during token validation:", err.response.data);
    } else if (err.response?.status === 404) {
      console.error("Endpoint not found during token validation:", err.response.data);
    } else {
      console.error("An unexpected error occurred during token validation:", err);
    }
  } else {
    console.error("Network or other error during token validation:", err);
  }
  localStorage.removeItem("token");
  setUser(null);
} finally {
setLoading(false);
}
};


validate();
}, []);


// Login with real backend
// In AuthContext.tsx

const login = async (email: string, password: string) => {
  setLoading(true);
  try {
    // 1. Send JSON (Your backend expects this Pydantic model)
    const res = await api.post("/auth/login", { email, password });

    // 2. Extract Token
    const { access_token } = res.data;
    
    if (!access_token) {
        throw new Error("Login succeeded but no token was returned.");
    }

    // 3. Save to Storage
    localStorage.setItem("token", access_token);
    
    // 4. Force update the Axios header immediately for the very next request
    // (Sometimes the interceptor doesn't pick up the localStorage change fast enough in the same tick)
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

    // 5. Now fetch the user profile
    const userProfileRes = await api.get("/auth/me");
    setUser(userProfileRes.data);

  } catch (err) {
    if (axios.isAxiosError(err)) {
      // If the error is 401, it is likely coming from the '/auth/me' call, not login!
      if (err.response?.status === 401 && err.config?.url?.includes('/auth/me')) {
         console.error("Login worked, but Profile Fetch failed. Check Token settings.");
      } else if (err.response?.status === 400) {
         // This is the actual Login failure (Wrong password/email)
         throw new Error("Invalid email or password.");
      }
      console.error("Login Error Details:", err.response?.data);
      throw new Error(err.response?.data?.detail || "Login failed.");
    }
    throw err;
  } finally {
    setLoading(false);
  }
};

// Register with real backend
const register = async (email: string, password: string, full_name?: string, partner_email?: string) => {
  setLoading(true);
  try {
    const payload: any = { email, password };
    if (full_name) payload.full_name = full_name;
    if (partner_email) payload.partner_email = partner_email;

    const res = await api.post("/auth/register", payload);

    const { access_token } = res.data;
    localStorage.setItem("token", access_token);
    // After registration, fetch the full user profile
    const userProfileRes = await api.get("/auth/me");
    setUser(userProfileRes.data);
  } catch (err) {
    console.error("Registration error:", err);
    if (axios.isAxiosError(err) && err.response) {
      console.error("Response status:", err.response.status);
      console.error("Response data:", err.response.data);
      // Handle 400 Bad Request for existing email
      if (err.response.status === 400) {
        throw new Error(err.response.data.detail || "Email already registered or invalid request.");
      }
      // Extract specific validation error messages from FastAPI
      if (err.response.status === 422 && Array.isArray(err.response.data.detail)) {
        const errorDetails = err.response.data.detail;
        const errorMessage = errorDetails.map((e: { msg: string }) => e.msg).join(". ");
        throw new Error(`Registration failed: ${errorMessage}`);
      }
      throw new Error(err.response.data.detail || "An unexpected error occurred during registration.");
    }
    console.error("Registration failed with an unknown error", err);
    throw new Error("An unknown error occurred. Please try again.");
  } finally {
    setLoading(false);
  }
};


const logout = () => {
localStorage.removeItem("token");
setUser(null);
};

const updateUser = (newUser: User) => {
  // Merges new user data with existing data for robustness
  setUser((currentUser) => (currentUser ? { ...currentUser, ...newUser } : newUser));
};

return (
<AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
  {children}
</AuthContext.Provider>
);
};