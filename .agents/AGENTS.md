
# Retro Chat Project Rules

These rules are non-negotiable for the Retro Chat project:

1. **Frontend Constraints**:

   * Use React with JavaScript (`.jsx`), not TypeScript (`.tsx`).
   * Use Tailwind CSS via Vite.
   * Do NOT introduce TypeScript anywhere in the frontend.
2. **Backend Constraints**:

   * Use Python 3.11+ and FastAPI.
   * Do NOT use Node.js (no Express, no NestJS).
   * Real-time communication must use native FastAPI/Starlette WebSockets (no separate libraries).
3. **Database Constraints**:

   * Use Supabase PostgreSQL.
   * Connect using `psycopg2` via SQLAlchemy.
   * Do NOT use Oracle, MongoDB, or MySQL.
4. **Product & Privacy Rules**:

   * **No algorithmic ranking**: Feeds and chats must be ordered strictly by timestamp (newest last in chat, newest first in blog).
   * **Hidden Usernames**: Usernames must be hidden until a friend request is accepted (enforced at the API level).
   * **Auth**: Email and password only (no phone numbers). Auth via JWT.
   * **No Engagement Hacking**: No unread-count guilt patterns, streaks, or growth-hacking copy.
   * **Scope limits**: No Android/mobile apps, no offline messaging, no group chats, no voice/video calling.
5. **General Practices**:

   * Favor clarity, correctness, and simplicity over speculative scale or premature abstraction.
   * Ask before installing any package not explicitly listed in the foundational setup.
