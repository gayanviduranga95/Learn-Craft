import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const res = await authApi.me();
        if (mounted && res?.data?.user) {
          setUser(res.data.user);
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (credentials) => {
    setError(null);
    const res = await authApi.login(credentials);
    if (res?.data?.user) {
      setUser(res.data.user);
    }
    return res;
  };

  const googleLogin = async ({ idToken, linkAccountPassword, role }) => {
    setError(null)
    const res = await authApi.google({ idToken, linkAccountPassword, role })
    if (res?.data?.user) {
      setUser(res.data.user)
    }
    return res
  }

  const register = async (userData) => {
    setError(null);
    return authApi.register(userData);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.me();
      if (res?.data?.user) {
        setUser(res.data.user);
      }
    } catch {
      setUser(null);
    }
  };

  const updateUserProfile = async (profileData) => {
    const res = await authApi.updateProfile(profileData);
    if (res?.data?.user) {
      setUser((prev) => ({ ...prev, ...res.data.user }));
    }
    return res;
  };

  const value = {
    user,
    loading,
    error,
    login,
    googleLogin,
    register,
    logout,
    refreshUser,
    updateUserProfile,
    isAuthenticated: Boolean(user),
    isInstructor: user?.role === "instructor" || user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
