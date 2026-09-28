import { createContext, useContext, useState, useEffect } from "react";
import { getMe } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem("user_cache");
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(() => {
    // If we have a cached user and token, we don't need to block render
    return !(localStorage.getItem("user_cache") && localStorage.getItem("token"));
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    getMe()
      .then((res) => {
        setUser(res.data);
        localStorage.setItem("user_cache", JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user_cache");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const loginUser = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user_cache", JSON.stringify(userData));
    setUser(userData);
  };
  const logout = () => { 
    localStorage.removeItem("token"); 
    localStorage.removeItem("user_cache"); 
    setUser(null); 
  };

  useEffect(() => {
    if (loading) return;
    
    if (user?.accent_color) {
      document.documentElement.setAttribute('data-theme', user.accent_color);
      localStorage.setItem('retro_theme', user.accent_color);
    } else if (!user) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem('retro_theme');
    }
    
    if (user?.font_choice) {
      document.documentElement.setAttribute('data-font', user.font_choice);
      localStorage.setItem('retro_font', user.font_choice);
    } else if (!user) {
      document.documentElement.removeAttribute('data-font');
      localStorage.removeItem('retro_font');
    }
  }, [user, loading]);

  const setAndCacheUser = (newUser) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem("user_cache", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("user_cache");
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser: setAndCacheUser, loginUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
