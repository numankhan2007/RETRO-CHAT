import Navbar from "./Navbar";
import { useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const location = useLocation();
  const isChats = location.pathname.startsWith("/chats");
  const isConversation = location.pathname.match(/^\/chats\/[^/]+$/);
  
  return (
    <div className={`min-h-screen bg-parchment-100 flex flex-col ${isConversation ? 'pb-0' : 'pb-[60px] md:pb-0'}`}>
      <div className={isConversation ? 'hidden md:block' : 'block'}>
        <Navbar />
      </div>
      <main className={`${isChats ? `max-w-full ${isConversation ? 'h-[100dvh]' : 'h-[calc(100dvh-60px)]'} md:h-[calc(100vh-4rem)] flex` : 'max-w-full mx-auto px-4 py-6 flex-1'} w-full`}>{children}</main>
    </div>
  );
}
