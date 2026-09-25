import { createContext, useContext, useState, useEffect } from "react";
import { getMe } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    getMe()
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const loginUser = (token, userData) => {
    localStorage.setItem("token", token);
    setUser(userData);
  };
  const logout = () => { localStorage.removeItem("token"); setUser(null); };

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

  return (
    <AuthContext.Provider value={{ user, setUser, loginUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
