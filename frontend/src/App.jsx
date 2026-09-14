import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ChatSocketProvider } from "./context/ChatSocketContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import VerifyResetOtpPage from "./pages/VerifyResetOtpPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ChatsListPage from "./pages/ChatsListPage";
import ChatsLayout from "./pages/ChatsLayout";
import ConversationPage from "./pages/ConversationPage";
import BlogFeedPage from "./pages/BlogFeedPage";
import CreatePostPage from "./pages/CreatePostPage";
import EditPostPage from "./pages/EditPostPage";
import PostDetailPage from "./pages/PostDetailPage";
import FriendsPage from "./pages/FriendsPage";
import SettingsPage from "./pages/SettingsPage";
import AppearanceSettingsPage from "./pages/AppearanceSettingsPage";
import BlockedUsersPage from "./pages/BlockedUsersPage";
import ProfilePage from "./pages/ProfilePage";
import AccountSettingsPage from "./pages/AccountSettingsPage";
import AboutPage from "./pages/AboutPage";
import TermsPage from "./pages/TermsPage";
import HelpPage from "./pages/HelpPage";
import NotificationSettingsPage from "./pages/NotificationSettingsPage";

function Protected({ children }) {
  return <ProtectedRoute><Layout>{children}</Layout></ProtectedRoute>;
}

export default function App() {
  return (
    <AuthProvider>
      <ChatSocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/chats" element={<Protected><ChatsLayout /></Protected>}>
              <Route index element={null} />
              <Route path="group/:groupId" element={<ConversationPage />} />
              <Route path=":friendId" element={<ConversationPage />} />
            </Route>
            <Route path="/blog" element={<Protected><BlogFeedPage /></Protected>} />
            <Route path="/blog/new" element={<Protected><CreatePostPage /></Protected>} />
            <Route path="/blog/:postId/edit" element={<Protected><EditPostPage /></Protected>} />
            <Route path="/blog/:postId" element={<Protected><PostDetailPage /></Protected>} />
            <Route path="/friends" element={<Protected><FriendsPage /></Protected>} />
            <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
            <Route path="/settings/appearance" element={<Protected><AppearanceSettingsPage /></Protected>} />
            <Route path="/settings/blocked" element={<Protected><BlockedUsersPage /></Protected>} />
            <Route path="/settings/account" element={<Protected><AccountSettingsPage /></Protected>} />
            <Route path="/settings/about" element={<Protected><AboutPage /></Protected>} />
            <Route path="/settings/terms" element={<Protected><TermsPage /></Protected>} />
            <Route path="/settings/help" element={<Protected><HelpPage /></Protected>} />
            <Route path="/settings/notifications" element={<Protected><NotificationSettingsPage /></Protected>} />
            <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </BrowserRouter>
      </ChatSocketProvider>
    </AuthProvider>
  );
}
