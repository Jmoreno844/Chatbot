"use client";
import React, { createContext, useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import axiosInstance from "../utils/axiosInstance";
import LoadingCircle from "../components/ui/loading_circle";

// Define the shape of our authentication context
export interface AuthContextType {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  logout: () => Promise<void>; // Add logout function
}

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isAuthLoading: false,
  setIsAuthenticated: () => {},
  logout: async () => {}, // Add default implementation
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Memoize public routes to prevent unnecessary re-renders
  const publicRoutes = useMemo(
    () => ["/login", "/registro", "/forgot-password"],
    []
  );

  // Logout function
  const logout = async () => {
    try {
      await axiosInstance.post("/api/logout");
      setIsAuthenticated(false);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Initial authentication check on mount
  useEffect(() => {
    axiosInstance
      .get("api/me")
      .then(() => {
        setIsAuthenticated(true);
      })
      .catch((error) => {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      })
      .finally(() => {
        setIsAuthLoading(false);
      });
  }, []);

  // Handle 401 unauthorized responses globally
  useEffect(() => {
    const interceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          router.refresh();
        }
        return Promise.reject(error);
      }
    );
    // Cleanup interceptor on unmount
    return () => {
      axiosInstance.interceptors.response.eject(interceptor);
    };
  }, [router]);

  // Protected route navigation guard
  useEffect(() => {
    if (
      !isAuthLoading &&
      !isAuthenticated &&
      !publicRoutes.includes(pathname)
    ) {
      router.push("/login");
    }
  }, [isAuthenticated, router, pathname, isAuthLoading, publicRoutes]);

  // Show loading state while checking authentication
  if (isAuthLoading || (!isAuthenticated && !publicRoutes.includes(pathname))) {
    return <LoadingCircle />;
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isAuthLoading, setIsAuthenticated, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
