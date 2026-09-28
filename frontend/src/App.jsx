import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ChatSocketProvider } from "./context/ChatSocketContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Statically import core unauthenticated pages
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import VerifyResetOtpPage from "./pages/VerifyResetOtpPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// Lazy load protected pages
const ChatsLayout = lazy(() => import("./pages/ChatsLayout"));
const ConversationPage = lazy(() => import("./pages/ConversationPage"));
const BlogFeedPage = lazy(() => import("./pages/BlogFeedPage"));
const CreatePostPage = lazy(() => import("./pages/CreatePostPage"));
const EditPostPage = lazy(() => import("./pages/EditPostPage"));
const PostDetailPage = lazy(() => import("./pages/PostDetailPage"));
const FriendsPage = lazy(() => import("./pages/FriendsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AppearanceSettingsPage = lazy(() => import("./pages/AppearanceSettingsPage"));
const BlockedUsersPage = lazy(() => import("./pages/BlockedUsersPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AccountSettingsPage = lazy(() => import("./pages/AccountSettingsPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const NotificationSettingsPage = lazy(() => import("./pages/NotificationSettingsPage"));

function Protected({ children }) {
  return (
    <ProtectedRoute>
      <Layout>
        <Suspense fallback={<div className="flex-1 flex items-center justify-center p-8 text-ink-muted">Loading...</div>}>
          {children}
        </Suspense>
      </Layout>
    </ProtectedRoute>
  );
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
