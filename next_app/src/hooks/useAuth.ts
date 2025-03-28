"use client";

import { useState, useContext } from "react";
import axiosInstance from "../utils/axiosInstance";
import { AuthContext } from "../contexts/AuthContext";

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupCredentials {
  email: string;
  password: string;
  name: string;
  lastName: string;
}

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authContext = useContext(AuthContext);

  const login = async ({ email, password }: LoginCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post("/api/login", {
        email,
        password,
      });
      authContext.setIsAuthenticated(true);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post("/api/forgot-password", {
        email,
      });
      return response.data;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al recuperar contraseña"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async ({
    email,
    name,
    lastName,
    password,
  }: SignupCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post("/api/register", {
        email,
        name,
        lastName,
        password,
      });
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error en el registro");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await authContext.logout();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cerrar sesión");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    forgotPassword,
    signUp,
    logout,
    loading,
    error,
  };
};
