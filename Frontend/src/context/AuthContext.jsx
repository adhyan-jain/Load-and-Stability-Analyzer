import { createContext, useContext, useState } from "react";
import { api } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("lsa_user");
    return saved ? JSON.parse(saved) : null;
  });

  async function login(email, password) {
    const res = await api.login({ email, password });
    const u = res.user;
    localStorage.setItem("lsa_user", JSON.stringify(u));
    setUser(u);
    return u;
  }

  async function signup(name, email, password) {
    const res = await api.signup({ name, email, password });
    const u = res.user;
    localStorage.setItem("lsa_user", JSON.stringify(u));
    setUser(u);
    return u;
  }

  function logout() {
    localStorage.removeItem("lsa_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
