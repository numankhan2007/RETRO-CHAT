import { Outlet, useParams } from "react-router-dom";
import ChatsListPage from "./ChatsListPage";

export default function ChatsLayout() {
  const { friendId } = useParams();
  
  return (
    <div className="flex h-full w-full overflow-hidden border-t border-accent-900">
      {/* Left pane: Chats List (30%) */}
      <div className={`w-full md:w-[30%] md:border-r border-accent-900 bg-parchment-100 flex flex-col ${friendId ? 'hidden md:flex' : 'flex'}`}>
         <ChatsListPage />
      </div>

      {/* Right pane: Conversation or Placeholder (70%) */}
      <div className={`w-full md:w-[70%] flex flex-col bg-parchment-050 ${friendId ? 'flex' : 'hidden md:flex'}`}>
         {friendId ? (
           <Outlet />
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-ink-muted bg-parchment-050">
               <span className="text-4xl mb-4">💬</span>
               <p className="font-mono text-sm">Select a chat to start messaging</p>
            </div>
         )}
      </div>
    </div>
  );
}
