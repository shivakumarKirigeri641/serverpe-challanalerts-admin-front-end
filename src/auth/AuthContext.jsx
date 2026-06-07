import React, { createContext, useContext, useEffect, useState } from "react";
import { getToken, clearToken } from "../api/client";
import { getMe } from "../api/admin";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await getMe();
        if (mounted) setAdmin(me);
      } catch {
        clearToken();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const signOut = () => {
    clearToken();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, setAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
