# RETRO CHAT — A Classic Social Communication and Blogging Platform

---

## Project Title

**RETRO CHAT — A Classic Social Communication and Blogging Platform**

---

## Team Members

| Role               | Name           |
| ------------------ | -------------- |
| Team Member        | NUMAN KHAN     |
| Team Member        | JAVEED ALI     |
| Team Member        | DHEENADHAYALAN |
| Team Member        | LOURDHUAKASH   |
| Team Member        | KARTHIKRAJ     |
| Project Supervisor | MAHENDRAN T    |

---

## Project Abstract

Retro Chat is a full-stack, privacy-first social communication and blogging platform inspired by the nostalgic aesthetics of early web design. It combines real-time one-on-one messaging with a full blogging system, all wrapped in a visually distinctive retro and brutalist design language featuring warm parchment backgrounds, bold accent colors, pixel-style and monospaced fonts, and blocky UI elements with hard drop-shadows. Unlike mainstream social platforms, Retro Chat intentionally avoids algorithmic feeds, engagement-hacking patterns (no unread-count guilt, no streaks), and data over-collection. All content is ordered purely by timestamp. Usernames remain hidden until a friend request is accepted, enforced at the API level.

---

## Problem Statement

Modern social media platforms prioritize engagement metrics over genuine human connection. Algorithmic feeds manipulate content visibility, dark patterns coerce users into compulsive usage, and privacy is routinely sacrificed for profit. There is a growing demand for simple, honest, and privacy-respecting communication tools that let users connect with friends without being subjected to manipulation.

---

## Proposed Solution

Retro Chat solves this by providing a clean, chronological, and privacy-respecting social platform with two core modules: Real-Time Chat and Blogging. The platform is built on a modern, secure, and scalable technology stack while deliberately adopting retro visual aesthetics to signal a return to simpler, more human-centered software.

---

## Technology Stack

### Frontend

| Technology         | Purpose                                                         | Version |
| ------------------ | --------------------------------------------------------------- | ------- |
| React              | UI component library (Single Page Application)                  | 19.x    |
| React Router DOM   | Client-side routing and navigation                              | 7.x     |
| Vite               | Fast development build tool and bundler                         | 8.x     |
| Tailwind CSS       | Utility-first CSS framework for styling                         | 3.4     |
| Axios              | HTTP client for REST API communication                          | 1.x     |
| Twemoji API        | Cross-platform emoji rendering using Twitter's open-source SVGs | 17.x    |
| emoji-picker-react | Searchable emoji picker component                               | 4.x     |
| react-easy-crop    | Image cropper for avatar uploads                                | 6.x     |

### Backend

| Technology       | Purpose                                                     | Version                     |
| ---------------- | ----------------------------------------------------------- | --------------------------- |
| Python           | Primary backend language                                    | 3.11+                       |
| FastAPI          | Async web framework (REST API and WebSockets)               | Latest                      |
| Uvicorn          | ASGI server for running FastAPI                             | Standard edition            |
| SQLAlchemy       | ORM for database access and queries                         | Latest                      |
| psycopg2         | PostgreSQL database adapter (connects Python to Supabase)   | Binary edition              |
| Pydantic         | Request/response data validation and serialization          | v2 (with pydantic-settings) |
| python-jose      | JWT (JSON Web Token) creation and verification              | With cryptography backend   |
| Passlib (bcrypt) | Secure password hashing                                     | Latest                      |
| FastAPI-Mail     | Asynchronous email sending (for OTP verification)           | Latest                      |
| SlowAPI          | API rate limiting (protects against abuse)                  | Latest                      |
| Boto3            | AWS S3-compatible client (for Cloudflare R2 avatar storage) | Latest                      |

### Database and Cloud

| Technology          | Purpose                                   |
| ------------------- | ----------------------------------------- |
| Supabase PostgreSQL | Cloud-hosted relational database          |
| Cloudflare R2       | Object storage for user avatar images     |
| Gmail SMTP          | Email delivery for OTP verification codes |

### Development Tools

| Tool       | Purpose                                              |
| ---------- | ---------------------------------------------------- |
| Git        | Version control                                      |
| npm        | Frontend package manager                             |
| pip / venv | Python dependency and virtual environment management |
| OxLint     | Fast frontend JavaScript linter                      |

---

## System Architecture

The application follows a clean client-server architecture with a clear separation of concerns.

### Architecture Overview

The system is composed of three layers:

1. **Frontend (Client)**: A React Single Page Application (SPA) that runs entirely in the user's browser. It communicates with the backend via REST API calls (using Axios) and maintains a persistent WebSocket connection for real-time chat messages.
2. **Backend (Server)**: A Python FastAPI application that exposes RESTful endpoints for all CRUD operations (authentication, chat, blog, friends, notifications, blocking, user profile) and a WebSocket endpoint for real-time message delivery. It uses SQLAlchemy as an ORM to interact with the database.
3. **Database and Storage**: Supabase PostgreSQL stores all structured data (users, messages, posts, friendships, etc.). Cloudflare R2 stores binary assets (user avatar images). Gmail SMTP is used as the email transport for OTP verification.

### Communication Flow

- **REST API**: The frontend sends HTTP requests to the backend for all operations (login, register, fetch posts, send messages, etc.). The backend responds with JSON data.
- **WebSocket**: Upon successful login, the frontend establishes a WebSocket connection to the backend. The backend pushes real-time events (new messages, message edits, message deletions) to the connected users instantly.
- **Authentication**: All protected endpoints require a JWT Bearer token in the Authorization header. The token is issued at login and stored in the browser's localStorage.

---

## Database Schema

The database consists of 12 tables, each mapped to a SQLAlchemy model.

### Tables

| Table Name                           | Description                                                        | Key Columns                                                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **users**                      | Stores user accounts                                               | id, email, name, username, password_hash, bio, accent_color, font_choice, wallpaper_id, is_verified, otp_code, otp_expires_at, avatar_url |
| **friend_requests**            | Tracks pending, accepted, and declined friend requests             | id, sender_id, receiver_id, status (pending/accepted/declined), created_at                                                                |
| **friendships**                | Stores established friendships between users                       | id, user_a_id, user_b_id, user_a_starred/pinned/muted, user_b_starred/pinned/muted                                                        |
| **conversations**              | Represents a one-on-one chat thread between two users              | id, user_a_id, user_b_id                                                                                                                  |
| **messages**                   | Stores individual chat messages within conversations               | id, conversation_id, sender_id, content, message_type, sent_at, reply_to_id, is_pinned, is_edited, is_deleted                             |
| **posts**                      | Blog posts authored by users                                       | id, author_id, title, content, visibility (public/friends/private), status (draft/published)                                              |
| **comments**                   | Comments on blog posts (supports threaded replies)                 | id, post_id, author_id, content, parent_id, is_pinned                                                                                     |
| **post_likes**                 | Tracks which users have liked which posts                          | id, post_id, user_id                                                                                                                      |
| **saved_posts**                | Tracks which users have saved (bookmarked) which posts             | id, post_id, user_id                                                                                                                      |
| **blocks**                     | Stores user block relationships                                    | id, blocker_id, blocked_id                                                                                                                |
| **notifications**              | In-app notifications for blog likes, comments, and friend requests | id, user_id, actor_id, post_id, type, is_read                                                                                             |
| **conversation_read_receipts** | Tracks the last message each user has read in each conversation    | id, conversation_id, user_id, last_read_message_id                                                                                        |

### Key Constraints

- **Unique friendships**: The friendships table enforces user_a_id less than user_b_id to prevent duplicate entries.
- **Unique conversations**: Same ordering constraint as friendships.
- **Unique blocks**: A user can only block another user once.
- **Unique likes and saves**: A user can only like or save a post once.
- **Cascade deletes**: Deleting a post cascades to its comments, likes, saved entries, and related notifications.

### Indexes

The database uses strategic indexes for performance: friend requests by receiver and status, messages by conversation and timestamp, posts by author and status, comments by post, notifications by user and read status, and blocks by blocker.

---

## Backend API Endpoints

The backend exposes 7 router modules with a total of 30+ REST endpoints and 1 WebSocket endpoint.

### Authentication Router (/auth)

| Method | Endpoint               | Description                                                                              |
| ------ | ---------------------- | ---------------------------------------------------------------------------------------- |
| POST   | /auth/register         | Register a new user account. Sends a 6-digit OTP to the provided email for verification. |
| POST   | /auth/verify-otp       | Verify email using the OTP code. Marks the user as verified.                             |
| POST   | /auth/resend-otp       | Resend a fresh OTP to the user's email.                                                  |
| POST   | /auth/login            | Login with email/username and password. Returns a JWT access token.                      |
| POST   | /auth/forgot-password  | Initiate password reset. Sends an OTP to the user's email.                               |
| POST   | /auth/verify-reset-otp | Verify the OTP for password reset.                                                       |
| POST   | /auth/reset-password   | Set a new password after OTP verification.                                               |
| GET    | /auth/me               | Get the currently authenticated user's profile.                                          |
| GET    | /auth/me/stats         | Get the authenticated user's post count and friend count.                                |

### Chat Router (/chat)

| Method    | Endpoint                                          | Description                                                                                                      |
| --------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| GET       | /chat/conversations                               | List all conversations with last message, unread count, and online status.                                       |
| GET       | /chat/conversations/{friend_id}/messages          | Fetch paginated messages for a specific conversation (cursor-based pagination).                                  |
| POST      | /chat/conversations/{friend_id}/messages          | Send a new message. Broadcasts to both users via WebSocket in real time. Rate limited to 60 messages per minute. |
| PATCH     | /chat/conversations/{friend_id}/messages/{id}/pin | Pin or unpin a message. Maximum 4 pinned messages per conversation.                                              |
| DELETE    | /chat/conversations/{friend_id}/messages/{id}     | Soft-delete a message. Content is cleared and marked as deleted.                                                 |
| PUT       | /chat/conversations/{friend_id}/messages/{id}     | Edit a message's content. Marks it as edited.                                                                    |
| POST      | /chat/conversations/{friend_id}/read              | Mark all messages in a conversation as read (updates read receipt).                                              |
| WebSocket | /chat/ws?token=xxx                                | Persistent WebSocket connection for receiving real-time message events.                                          |

### Blog Router (/blog)

| Method | Endpoint                           | Description                                                                                        |
| ------ | ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| POST   | /blog                              | Create a new blog post. Rate limited to 20 per minute.                                             |
| GET    | /blog/feed                         | Get the user's personalized feed (public posts + friends' posts). Cursor-based infinite scrolling. |
| GET    | /blog/posts/mine                   | Get the current user's own posts.                                                                  |
| GET    | /blog/posts/saved                  | Get the current user's saved/bookmarked posts.                                                     |
| GET    | /blog/posts/{id}                   | Get a single post with like count, comment count, and like/save status.                            |
| PUT    | /blog/posts/{id}                   | Update a post (author only).                                                                       |
| DELETE | /blog/posts/{id}                   | Delete a post (author only). Cascades to comments, likes, and saves.                               |
| POST   | /blog/posts/{id}/comments          | Add a comment to a post. Supports threaded replies via parent_id. Creates a notification.          |
| GET    | /blog/posts/{id}/comments          | List all comments for a post (pinned first, then chronological).                                   |
| DELETE | /blog/posts/{id}/comments/{id}     | Delete a comment (comment author or post author).                                                  |
| POST   | /blog/posts/{id}/comments/{id}/pin | Pin or unpin a comment (post author only, max 3 pinned).                                           |
| POST   | /blog/posts/{id}/like              | Like a post. Creates a notification for the author.                                                |
| DELETE | /blog/posts/{id}/like              | Unlike a post.                                                                                     |
| POST   | /blog/posts/{id}/save              | Save/bookmark a post.                                                                              |
| DELETE | /blog/posts/{id}/save              | Unsave a post.                                                                                     |

### Friends Router (/friends)

| Method | Endpoint                       | Description                                                                 |
| ------ | ------------------------------ | --------------------------------------------------------------------------- |
| POST   | /friends/request               | Send a friend request by username. Checks for existing requests and blocks. |
| GET    | /friends/requests              | List incoming pending friend requests.                                      |
| POST   | /friends/requests/{id}/accept  | Accept a friend request. Creates the friendship.                            |
| POST   | /friends/requests/{id}/decline | Decline a friend request.                                                   |
| GET    | /friends                       | List all friends with their star, pin, and mute preferences.                |
| PATCH  | /friends/{id}/preferences      | Update friend preferences (star, pin, mute).                                |
| DELETE | /friends/{id}                  | Remove a friend. Also cleans up associated friend requests.                 |

### Users Router (/users)

| Method | Endpoint                       | Description                                                         |
| ------ | ------------------------------ | ------------------------------------------------------------------- |
| PUT    | /users/me                      | Update profile (name, username, bio).                               |
| PUT    | /users/me/theme                | Update theme preferences (accent color, font choice).               |
| DELETE | /users/me                      | Permanently delete the account.                                     |
| POST   | /users/me/avatar/presigned-url | Get a presigned URL for uploading an avatar image to Cloudflare R2. |
| POST   | /users/me/avatar/complete      | Confirm avatar upload and update the user's avatar_url.             |
| GET    | /users/search                  | Search users by username (for adding friends).                      |

### Notifications Router (/notifications)

| Method | Endpoint                 | Description                                                           |
| ------ | ------------------------ | --------------------------------------------------------------------- |
| GET    | /notifications           | Get all unread notifications (blog likes, comments, friend requests). |
| POST   | /notifications/{id}/read | Mark a single notification as read.                                   |
| POST   | /notifications/read-all  | Mark all notifications as read.                                       |

### Blocks Router (/blocks)

| Method | Endpoint     | Description                                                                       |
| ------ | ------------ | --------------------------------------------------------------------------------- |
| GET    | /blocks      | List all users blocked by the current user.                                       |
| POST   | /blocks      | Block a user. Automatically removes any existing friendship and pending requests. |
| DELETE | /blocks/{id} | Unblock a user.                                                                   |

---

## Frontend Pages and Their Functionality

The frontend consists of 24 page components and 18 reusable UI components, providing a complete user experience.

### Public Pages (No Authentication Required)

#### 1. Landing Page (/)

The first page users see. Displays the Retro Chat logo, the tagline "Connect with friends, share your thoughts, and experience the nostalgic vibes of the web," and a single "Start Now" call-to-action button that navigates to the login page. Clean, centered layout with the retro parchment background.

#### 2. Login Page (/login)

A centered form card with the Retro Chat logo, email/username input, password input, and a "Log In" button. Includes links to "Forgot your password?" and "New here? Create an account." On successful login, the JWT token is stored in localStorage, the user object is fetched, and the user is redirected to the Chats page. Displays inline error messages for invalid credentials.

#### 3. Register Page (/register)

A centered form card titled "JOIN RETRO CHAT" with five fields: Name, Username (alphanumeric with dots and underscores, max 20 characters), Email, Password (minimum 8 characters, must include uppercase, lowercase, number, and special character), and Confirm Password. Client-side validation enforces password rules before submission. On success, the user is redirected to the OTP verification page with the email passed via router state.

#### 4. Verify OTP Page (/verify-otp)

After registration, the user must verify their email. This page displays a 6-digit code input field. Users can enter the OTP received in their email. Includes a "Resend Code" button that generates and sends a fresh OTP. Maximum 5 incorrect attempts before lockout (enforced on the server).

#### 5. Forgot Password Page (/forgot-password)

Allows users to initiate a password reset by entering their email or username. Sends an OTP to the associated email address.

#### 6. Verify Reset OTP Page (/verify-reset-otp)

Accepts the OTP sent during the forgot password flow. On successful verification, navigates to the Reset Password page.

#### 7. Reset Password Page (/reset-password)

Allows users to set a new password. Requires entering the new password and confirming it. Validates that both fields match and enforces the same password complexity rules as registration.

### Protected Pages (Authentication Required)

#### 8. Chats Layout (/chats)

The master layout for the messaging module. Uses a split-pane design: 30% width left sidebar for the conversations list and 70% width right pane for the active conversation. On mobile, only one pane is shown at a time (the list or the conversation), toggled by selecting a chat or pressing the "Back" button. This layout wraps the Chats List and Conversation pages as nested routes.

#### 9. Chats List Page (Left Sidebar)

Displays all active conversations sorted by the most recent message (newest first). Each conversation item shows the friend's avatar, username, the last message preview (truncated), the timestamp, an unread message indicator, and online/offline status. The search bar at the top filters conversations by friend name. Unread conversations are visually highlighted with bold text.

#### 10. Conversation Page (/chats/:friendId)

The core real-time messaging interface. Features include:

- **Message Display**: Messages are rendered as chat bubbles. The current user's messages appear on the right (dark accent color), and the friend's messages appear on the left (light parchment color). Each bubble shows the message content, timestamp, and optional "Edited" or "Pinned" indicators.
- **Real-Time Delivery**: New messages from the friend arrive instantly via WebSocket without page refresh.
- **Text Formatting**: Supports bold (asterisks or HTML bold tag), italic (underscores or HTML italic tag), underline (HTML underline tag), strikethrough (tilde or HTML strikethrough tag), code (backticks or HTML code tag), blockquotes (greater-than prefix), links (markdown-style), and lists (bullet and numbered).
- **Emoji Support**: Integrated emoji picker component and all emojis rendered using Twitter's Twemoji SVG library for cross-platform consistency.
- **Reply-to-Message**: Swipe right on a message (touch) or use the context menu (right-click on desktop) to reply. The replied-to message is displayed as a quoted block above the new message.
- **Message Pinning**: Users can pin up to 4 messages per conversation. Pinned messages are accessible via a "Pinned Messages" modal in the header.
- **Message Editing**: Users can edit their own messages. Edited messages show an "(Edited)" tag.
- **Message Deletion**: Users can delete their own messages. Deleted messages show "This message was deleted" in their place (soft delete).
- **Context Menu**: Right-click or long-press on a message opens a context menu with options: Reply, Pin/Unpin, Edit (own messages only), Delete (own messages only), and Copy Text.
- **Infinite Scrolling**: Messages are loaded in pages of 50. Scrolling to the top loads older messages via cursor-based pagination.
- **Format Toolbar**: A toolbar above the input area provides one-click formatting buttons for bold, italic, underline, strikethrough, code, blockquote, links, and lists.
- **Slash Commands**: Typing a forward slash in the input field opens a slash command menu. Currently supports /shrug (appends the shrug emoji), /tableflip, and /unflip.
- **Blocking**: Users can block the conversation partner from the header menu, which removes the friendship, prevents further messaging, and navigates back.

#### 11. Blog Feed Page (/blog)

The blogging hub. Features three tabs:

- **Feed**: Shows all published posts the user can see (public posts and posts from friends) ordered by creation date (newest first). Posts from blocked users are excluded.
- **Saved Posts**: Shows posts the user has bookmarked.
- **My Posts**: Shows only the user's own posts.
  Each post is rendered as a PostCard component showing the author's avatar, username, creation date, post title, a content preview (truncated to 3 lines), the visibility badge (public/friends/private), like count, comment count, like button, and save/bookmark button. A "Write a Post" button in the header navigates to the post creation page. Posts load via infinite scrolling with cursor-based pagination (20 posts per page).

#### 12. Create Post Page (/blog/new)

A form with a Title field, Content textarea, a visibility selector (Public, Friends Only, Private), and a Publish button. Authors can write rich text with the same formatting syntax used in chat messages.

#### 13. Edit Post Page (/blog/:postId/edit)

Pre-populates the create post form with the existing post data. Only the post author can access this page.

#### 14. Post Detail Page (/blog/:postId)

The full post view with:

- The author's avatar and username (clickable to send a friend request if not already friends).
- Full post content rendered with text formatting.
- Like and Save buttons with live counts.
- A complete comments section supporting threaded replies (parent-child comment hierarchy with collapsible reply threads).
- Comment actions: Reply, Delete (author or post owner), Pin/Unpin (post author only, max 3 pinned comments).
- A comment input field at the bottom.

#### 15. Friends Page (/friends)

Three tabs for managing social connections:

- **My Friends**: Lists all accepted friends with their avatar, name, bio, and preference indicators (starred, pinned, muted). Each friend card has a "Message" button (navigates to the chat) and a menu button with options: Star/Unstar, Pin/Unpin, Mute/Unmute, Remove Friend, and Block.
- **Pending**: Shows incoming friend requests with Accept and Decline buttons.
- **Add Friend**: A username search field. Type a username to search for users and send them a friend request.
  All actions use confirmation modals for destructive operations (remove friend, block user).

#### 16. Profile Page (/profile)

Displays the current user's profile:

- Circular avatar with a hover overlay to upload a new photo (image is cropped to a circle using the react-easy-crop library, converted to WebP format, and uploaded to Cloudflare R2 via presigned URL).
- Name, username, bio, post count, and friend count.
- "Edit Profile" button to modify name, username, and bio inline.
- Navigation buttons to Settings, Appearance, Notifications, and Logout.

#### 17. Settings Page (/settings)

A settings hub page with categorized navigation:

- **Appearance**: Navigate to Theme and Display settings.
- **Notifications**: Navigate to Sounds and Alerts settings.
- **Privacy**: Navigate to Blocked Users management.
- **Support and About**: Navigate to Help and Support, About, and Terms and Policy pages.
- **Account**: Navigate to Account Management (change password, delete account).
- **App Version**: Displays "Retro Chat v1.0.0" and a "Check for Updates" button.

#### 18. Appearance Settings Page (/settings/appearance)

Allows users to customize the visual theme of the application:

- **Accent Color**: Choose from 7 themes: Default (Olive green), Coral, Sage, Ocean, Sunset, Lavender, and Cherry. Each theme changes all accent colors, background tones, text colors, and border colors across the entire application using CSS custom properties.
- **Font**: Choose from 6 font families: Default, Mono (Space Mono), Serif (Georgia), Sans (Helvetica), Cursive (Comic Sans), and Pixel (Pixelify Sans plus VT323). The font choice applies to both display headings and body text.
- **Live Preview**: Theme and font changes are previewed in real time before saving.

#### 19. Notification Settings Page (/settings/notifications)

Controls notification behavior:

- **Sound**: Toggle notification sounds on/off. When enabled, plays a preview sound. Preference stored in localStorage.
- **Desktop Alerts**: Toggle browser push notifications. Requests the Notification API permission if not already granted. Sends a test notification upon enabling.

#### 20. Account Settings Page (/settings/account)

Account management options:

- **Change Password**: Enter current password, new password, and confirm new password.
- **Delete Account**: Permanently delete the account with a confirmation modal warning that this action is irreversible.

#### 21. Blocked Users Page (/settings/blocked)

Lists all users the current user has blocked, with an "Unblock" button for each. Unblocking does not automatically restore the previous friendship.

#### 22. About Page (/settings/about)

Displays information about the Retro Chat application, its mission, and its design philosophy.

#### 23. Terms Page (/settings/terms)

Displays the Terms of Service and Privacy Policy.

#### 24. Help Page (/settings/help)

Provides help documentation and frequently asked questions.

---

## Reusable UI Components

The frontend uses 18 reusable components that form the design system:

| Component                   | Description                                                                                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Layout**            | The main app shell. Renders the Navbar and wraps page content. Adjusts layout for chat pages (full height, no padding) versus standard pages.                                                                                                          |
| **Navbar**            | Global navigation bar. Fixed at the bottom on mobile, sticky at the top on desktop. Contains links to Chats, Blog, Friends, and Profile. Shows the Retro Chat logo and notification bell (desktop only). Active link is highlighted with an underline. |
| **ProtectedRoute**    | Route guard component. Redirects unauthenticated users to the login page.                                                                                                                                                                              |
| **Button**            | Styled button with variants (primary, secondary, ghost) and sizes (sm, md, lg). Uses the retro blocky aesthetic with drop-shadow on hover.                                                                                                             |
| **Input**             | Styled text input with label support. Matches the parchment design theme.                                                                                                                                                                              |
| **Card**              | Container component with border, shadow, and parchment background.                                                                                                                                                                                     |
| **Alert**             | Inline alert component for displaying success and error messages.                                                                                                                                                                                      |
| **Badge**             | Small label component for displaying post visibility (public/friends/private).                                                                                                                                                                         |
| **Avatar**            | User avatar component. Displays the uploaded avatar image or generates a fallback with the first letter of the username on a colored background.                                                                                                       |
| **Skeleton**          | Loading placeholder component with a shimmer animation. Used during data fetching.                                                                                                                                                                     |
| **PostCard**          | Blog post card with author info, title, content preview, like/comment/save actions.                                                                                                                                                                    |
| **MessageBubble**     | Chat message bubble with support for formatting, replies, pins, edits, and deletes. Includes swipe-to-reply (touch) and context menu (desktop) interactions.                                                                                           |
| **NotificationBell**  | Notification center. Polls for friend requests, unread messages, and blog notifications every 30 seconds. Displays a badge with the total count. Opens a dropdown listing all notifications grouped by type.                                           |
| **ConfirmModal**      | Reusable confirmation dialog for destructive actions (delete post, remove friend, block user, delete account).                                                                                                                                         |
| **EmojiPicker**       | Emoji picker powered by emoji-picker-react. Supports searchable emoji selection with Twemoji rendering.                                                                                                                                                |
| **FormatToolbar**     | Text formatting toolbar for the chat input. Provides one-click buttons for bold, italic, underline, strikethrough, code, blockquotes, links, and lists.                                                                                                |
| **SlashCommandMenu**  | Popup menu triggered by typing a forward slash in the chat input. Provides quick-access slash commands.                                                                                                                                                |
| **ImageCropperModal** | Image cropping modal for avatar uploads. Uses react-easy-crop for circular crop selection and outputs the cropped image as a WebP blob.                                                                                                                |

---

## Key Features Implemented

### Real-Time Communication

- WebSocket-powered instant message delivery using native FastAPI/Starlette WebSockets.
- Connection Manager that tracks active users by user ID and supports multi-device connections.
- Online status detection (friend shown as online when their WebSocket is connected).
- Optimistic UI updates on the frontend with real-time synchronization.

### Security and Privacy

- JWT-based authentication (Bearer token scheme) with configurable expiry (default 24 hours).
- Bcrypt password hashing (via Passlib) with automatic salt generation.
- Email verification via 6-digit OTP with 10-minute expiry and maximum 5 attempts.
- Rate limiting on sensitive endpoints (60 messages/minute, 20 posts/minute).
- Blocked user enforcement: blocked users cannot send messages, friend requests, or view posts.
- Usernames are hidden from search results until friendship is established.
- XSS prevention in text formatting (URLs are validated to start with http, https, or mailto).
- Presigned URLs for secure avatar uploads (server never handles file bytes directly).

### Theming and Customization

- 7 color themes: Olive (default), Coral, Sage, Ocean, Sunset, Lavender, Cherry.
- 6 font families: Default, Mono, Serif, Sans, Cursive, Pixel.
- Themes implemented via CSS custom properties (CSS variables) for instant application.
- User preferences persisted in the database and applied on login.

### Blogging Platform

- Full CRUD for blog posts with title, rich content, and visibility controls.
- Three visibility levels: Public (everyone), Friends (accepted friends only), Private (author only).
- Like and bookmark/save system with live counts.
- Threaded comment system with parent-child reply hierarchy and collapsible threads.
- Comment pinning (post author can pin up to 3 comments).
- Notification system for likes and comments on your posts.

### Friend Management

- Friend request system: Send, Accept, Decline.
- Per-friend preferences: Star (favorites), Pin (always at top), Mute (suppress notifications).
- User search by username for discovering and adding friends.
- Friend removal with automatic cleanup of related requests.

### Chat Features

- Message pinning (up to 4 per conversation).
- Message editing with "Edited" indicator.
- Soft message deletion with "This message was deleted" placeholder.
- Reply-to-message with quoted reference.
- Rich text formatting support (bold, italic, underline, strikethrough, code, quotes, links, lists).
- Emoji picker and cross-platform Twemoji rendering.
- Swipe-to-reply gesture on mobile touch devices.
- Slash commands (/shrug, /tableflip, /unflip).
- Read receipts with unread message count per conversation.
- Cursor-based infinite scrolling for message history.

### User Profile

- Customizable avatar with client-side crop-to-circle and WebP conversion.
- Secure upload to Cloudflare R2 via presigned URLs.
- Editable name, username, and bio.
- Post count and friend count statistics.

---

## Performance Optimizations

- **N+1 Query Prevention**: All list endpoints (conversations, friends, notifications, comments, blocks) use bulk queries to fetch related data (user profiles, posts, receipts) in a single SQL query instead of per-item queries.
- **Cursor-Based Pagination**: All feed and message list endpoints use timestamp-based cursors instead of offset pagination for consistent performance as data grows.
- **React.memo**: The MessageBubble component uses React.memo with a custom comparison function to prevent unnecessary re-renders during chat scrolling.
- **Intersection Observer**: Both the blog feed and message list use the Intersection Observer API for efficient infinite scrolling (no scroll event listeners).
- **Debounced Search**: User search in the friends page is debounced to avoid excessive API calls.
- **Strategic Database Indexes**: Indexes on friend_requests (receiver_id, status), messages (conversation_id, sent_at), posts (author_id, status), comments (post_id), notifications (user_id, is_read), and blocks (blocker_id).

---

## Future Enhancements

### Phase 2 — Planned Features

1. **Image and Media Sharing in Chat**: Allow users to share images and files within conversations, stored in Cloudflare R2.
2. **Blog Post Images**: Support for embedded images in blog posts.
3. **Advanced Search**: Full-text search across blog posts and message history.
4. **Typing Indicators**: Show "User is typing..." in real time via WebSocket.
5. **Message Reactions**: Allow users to react to messages with emojis.
6. **Email Notifications**: Send email digests for missed messages and interactions.

### Phase 3 — Long-Term Vision

7. **End-to-End Encryption (E2EE)**: Implement client-side encryption for chat messages so that even the server cannot read message content.
8. **PWA (Progressive Web App)**: Add offline support, push notifications, and installability so Retro Chat works like a native mobile app.
9. **Chat Export**: Allow users to export their conversation history as text or PDF files.
10. **Multi-Language Support**: Internationalization (i18n) for supporting multiple languages.
11. **Admin Dashboard**: A separate admin panel for monitoring platform health, managing reported content, and user moderation.
12. **Blog Post Markdown Editor**: A full WYSIWYG markdown editor with live preview for writing blog posts.

---

## Project Structure

```
RETRO-CHAT/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── core/
│   │   │   ├── config.py        # Environment configuration (Pydantic Settings)
│   │   │   ├── deps.py          # Dependency injection (auth guards)
│   │   │   ├── security.py      # Password hashing and JWT utilities
│   │   │   ├── ws_manager.py    # WebSocket connection manager
│   │   │   └── limiter.py       # Rate limiter configuration
│   │   ├── db/
│   │   │   ├── database.py      # SQLAlchemy engine and session factory
│   │   │   ├── init_db.py       # Database initialization script
│   │   │   ├── schema.sql       # Full PostgreSQL schema (12 tables)
│   │   │   └── seed.py          # Database seeding script
│   │   ├── models/              # SQLAlchemy ORM models (13 models)
│   │   │   ├── user.py
│   │   │   ├── friend_request.py
│   │   │   ├── friendship.py
│   │   │   ├── conversation.py
│   │   │   ├── message.py
│   │   │   ├── post.py
│   │   │   ├── comment.py
│   │   │   ├── block.py
│   │   │   ├── notification.py
│   │   │   ├── like.py
│   │   │   ├── saved_post.py
│   │   │   └── read_receipt.py
│   │   ├── routers/             # API route handlers (7 modules)
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── chat.py          # Chat and WebSocket endpoints
│   │   │   ├── blog.py          # Blog CRUD and interactions
│   │   │   ├── friends.py       # Friend request and management
│   │   │   ├── users.py         # Profile and avatar management
│   │   │   ├── notifications.py # Notification endpoints
│   │   │   └── blocks.py        # Block/unblock endpoints
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   └── services/            # Business logic services
│   │       ├── email_service.py # OTP generation and email sending
│   │       └── friendship_service.py  # Friendship validation helpers
│   ├── requirements.txt         # Python dependencies
│   └── .env                     # Environment variables (not in Git)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Root component with routing
│   │   ├── main.jsx             # React entry point
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  # Authentication state management
│   │   │   └── ChatSocketContext.jsx  # WebSocket connection management
│   │   ├── components/          # 18 reusable UI components
│   │   ├── pages/               # 24 page components
│   │   ├── services/            # API service modules (Axios)
│   │   ├── utils/               # Utility functions (text formatting, image cropping)
│   │   └── styles/
│   │       └── index.css        # Global styles, theme variables, animations
│   ├── public/                  # Static assets (logo, twemoji SVGs)
│   ├── package.json             # Node.js dependencies
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   └── vite.config.js           # Vite build configuration
│
├── wireframes/                  # Standalone HTML wireframe prototypes
│   ├── presentation.html        # Interactive connected wireframe
│   ├── index.html               # Chat wireframe
│   ├── blog.html                # Blog wireframe
│   ├── friends.html             # Friends wireframe
│   └── profile.html             # Profile wireframe
│
├── .gitignore                   # Git ignore rules
└── README.md                    # Project documentation
```

---

## Conclusion

Retro Chat is a fully functional, privacy-respecting, full-stack social communication and blogging platform built from the ground up. It demonstrates competency in modern web development across the entire stack: from database schema design and RESTful API architecture on the backend, to reactive UI engineering and real-time WebSocket communication on the frontend, to cloud storage integration and email-based authentication flows. The retro aesthetic is not merely cosmetic — it is a deliberate design choice that signals a return to user-centered software that respects its users' attention, privacy, and autonomy.
