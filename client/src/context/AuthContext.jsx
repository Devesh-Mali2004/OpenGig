import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("opengig_user")) || null; }
    catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("opengig_token") || null);

  const loginUser = (userData, authToken) => {
    localStorage.setItem("opengig_user",  JSON.stringify(userData.user || userData));
    localStorage.setItem("opengig_token", authToken);
    setUser(userData.user || userData);
    setToken(authToken);
  };

  const logoutUser = () => {
    localStorage.removeItem("opengig_user");
    localStorage.removeItem("opengig_token");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}