
import {
  createContext,
  useContext,
  useState,
} from "react";

import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Restore a saved user session.
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "null"
      );
    } catch {
      return null;
    }
  });

  // Save the token and user details.
  function saveAuth(data) {
    localStorage.setItem("token", data.token);

    localStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );

    setUser(data.user);
  }

  // Login with email and password.
  async function login(credentials) {
    const { data } = await api.post(
      "/auth/login",
      credentials
    );

    saveAuth(data);
  }

  // Register a new account.
  async function register(fields) {
    const { data } = await api.post(
      "/auth/register",
      fields
    );

    saveAuth(data);
  }

  // End the current session.
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
