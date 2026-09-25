-- ============================================================
-- Retro Chat — Canonical Schema (Postgres / Supabase)
-- Matches all 13 SQLAlchemy models. Use TIMESTAMPTZ everywhere.
-- ============================================================

-- ============================================================
-- 1. users
-- ============================================================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    bio             VARCHAR(500),
    accent_color    VARCHAR(20)  DEFAULT 'olive',
    font_choice     VARCHAR(50)  DEFAULT 'default',
    wallpaper_id    VARCHAR(50)  DEFAULT 'none',
    is_verified     BOOLEAN      DEFAULT FALSE,

    created_at      TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. friend_requests
-- ============================================================
CREATE TABLE friend_requests (
    id              SERIAL PRIMARY KEY,
    sender_id       INTEGER NOT NULL REFERENCES users(id),
    receiver_id     INTEGER NOT NULL REFERENCES users(id),
    status          VARCHAR(20) DEFAULT 'pending'
                        CHECK (status IN ('pending','accepted','declined')),
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    responded_at    TIMESTAMPTZ,
    CONSTRAINT uq_friend_request UNIQUE (sender_id, receiver_id)
);

-- ============================================================
-- 3. friendships
-- ============================================================
CREATE TABLE friendships (
    id              SERIAL PRIMARY KEY,
    user_a_id       INTEGER NOT NULL REFERENCES users(id),
    user_b_id       INTEGER NOT NULL REFERENCES users(id),
    user_a_starred  BOOLEAN DEFAULT FALSE,
    user_b_starred  BOOLEAN DEFAULT FALSE,
    user_a_pinned   BOOLEAN DEFAULT FALSE,
    user_b_pinned   BOOLEAN DEFAULT FALSE,
    user_a_muted    BOOLEAN DEFAULT FALSE,
    user_b_muted    BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_friendship UNIQUE (user_a_id, user_b_id),
    CONSTRAINT chk_friendship_order CHECK (user_a_id < user_b_id)
);

-- ============================================================
-- 4. conversations
-- ============================================================
CREATE TABLE conversations (
    id              SERIAL PRIMARY KEY,
    user_a_id       INTEGER NOT NULL REFERENCES users(id),
    user_b_id       INTEGER NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_conversation UNIQUE (user_a_id, user_b_id),
    CONSTRAINT chk_conversation_order CHECK (user_a_id < user_b_id)
);

-- ============================================================
-- 5. messages
-- ============================================================
CREATE TABLE messages (
    id              SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       INTEGER NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    message_type    VARCHAR(20) DEFAULT 'text'
                        CHECK (message_type IN ('text','sticker','emoji')),
    sent_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    reply_to_id     INTEGER REFERENCES messages(id) ON DELETE SET NULL,
    is_pinned       BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- 6. posts
-- ============================================================
CREATE TABLE posts (
    id              SERIAL PRIMARY KEY,
    author_id       INTEGER NOT NULL REFERENCES users(id),
    title           VARCHAR(200) NOT NULL,
    content         TEXT NOT NULL,
    visibility      VARCHAR(20) DEFAULT 'friends'
                        CHECK (visibility IN ('public','friends','private')),
    status          VARCHAR(20) DEFAULT 'draft'
                        CHECK (status IN ('draft','published')),
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. comments
-- ============================================================
CREATE TABLE comments (
    id              SERIAL PRIMARY KEY,
    post_id         INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id       INTEGER NOT NULL REFERENCES users(id),
    content         VARCHAR(2000) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 8. blocks
-- ============================================================
CREATE TABLE blocks (
    id              SERIAL PRIMARY KEY,
    blocker_id      INTEGER NOT NULL REFERENCES users(id),
    blocked_id      INTEGER NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_block UNIQUE (blocker_id, blocked_id)
);

-- ============================================================
-- 9. notifications
-- ============================================================
CREATE TABLE notifications (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id),
    actor_id        INTEGER NOT NULL REFERENCES users(id),
    post_id         INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 10. post_likes
-- ============================================================
CREATE TABLE post_likes (
    id              SERIAL PRIMARY KEY,
    post_id         INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_post_like UNIQUE (post_id, user_id)
);

-- ============================================================
-- 11. saved_posts
-- ============================================================
CREATE TABLE saved_posts (
    id              SERIAL PRIMARY KEY,
    post_id         INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_saved_post UNIQUE (post_id, user_id)
);

-- ============================================================
-- 12. conversation_read_receipts
-- ============================================================
CREATE TABLE conversation_read_receipts (
    id                   SERIAL PRIMARY KEY,
    conversation_id      INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_message_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_read_receipt UNIQUE (conversation_id, user_id)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_friend_req_receiver ON friend_requests(receiver_id, status);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, sent_at);
CREATE INDEX idx_posts_author_status ON posts(author_id, status);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
