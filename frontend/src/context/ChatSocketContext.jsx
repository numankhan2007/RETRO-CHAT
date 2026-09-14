import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const ChatSocketContext = createContext(null);

export function ChatSocketProvider({ children }) {
  const { user } = useAuth();
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    const wsBase = import.meta.env.VITE_API_BASE_URL.replace(/^http/, "ws"); // http->ws, https->wss
    const ws = new WebSocket(`${wsBase}/chat/ws?token=${token}`);
    ws.onmessage = (event) => setLastMessage(JSON.parse(event.data));
    wsRef.current = ws;
    return () => ws.close();
  }, [user]);

  return (
    <ChatSocketContext.Provider value={{ lastMessage }}>
      {children}
    </ChatSocketContext.Provider>
  );
}

export const useChatSocket = () => useContext(ChatSocketContext);
