import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const API_URL = "http://localhost:5000/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Load user from localStorage on app start ─────────────────────────────
  useEffect(() => {
    try {
      const savedUser  = localStorage.getItem("opengig_user");
      const savedToken = localStorage.getItem("opengig_token");
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
      }
    } catch {
      localStorage.removeItem("opengig_user");
      localStorage.removeItem("opengig_token");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  const loginUser = async (email, password) => {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem("opengig_token", token);
    localStorage.setItem("opengig_user",  JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  // ── REGISTER ──────────────────────────────────────────────────────────────
  const registerUser = async (formData) => {
    const res = await axios.post(`${API_URL}/auth/signup`, formData);
    const { token, user: userData } = res.data;
    localStorage.setItem("opengig_token", token);
    localStorage.setItem("opengig_user",  JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  // ── LOGOUT ────────────────────────────────────────────────────────────────
  const logoutUser = () => {
    localStorage.removeItem("opengig_token");
    localStorage.removeItem("opengig_user");
    setUser(null);
  };

  // ── Get token helper ──────────────────────────────────────────────────────
  const getToken = () => localStorage.getItem("opengig_token");

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, registerUser, logoutUser, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export default AuthContext;