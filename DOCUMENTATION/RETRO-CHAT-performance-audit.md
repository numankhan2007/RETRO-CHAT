# RETRO CHAT — Full Performance & Architecture Audit

**Repository audited:** `RETRO-CHAT-main.zip`  
**Audit type:** Static source-code audit + local validation of the uploaded repository  
**Audit date:** 2026-09-28  
**Scope:** Frontend, chat/WebSocket path, backend APIs, SQL/query patterns, PostgreSQL schema/indexes, R2/S3 object path, browser/network behavior, assets, build structure, reliability issues that directly affect perceived performance, and maintainability risks that will become performance problems at scale.

> This report is based on the uploaded ZIP, not the earlier markdown snapshot.

---

## 1. Executive conclusion

The project has a workable architecture for an early-stage social/chat application, but there are several issues that will become visible as soon as users keep long conversations, accumulate notifications, grow friend/conversation counts, or build a meaningful blog feed.

The most important findings are:

1. **A frontend WebSocket state-effect loop exists in `ConversationPage.jsx`.** The effect depends on `messages` and also calls `setMessages`, and the existing-message branch creates a new array every time. This is a **P0 correctness/performance defect**.
2. **`/chat/conversations` contains an N+1 unread-count query and per-conversation Redis presence lookup.** This can scale with the number of conversations rather than with one bounded query.
3. **The blog feed query joins likes, comments, and saves simultaneously.** That can create an intermediate row multiplication problem (`likes × comments × saves`) before `COUNT(DISTINCT ...)` corrects the final values.
4. **The notification bell performs three API calls every 30 seconds and again on every incoming WebSocket message.** This multiplies the cost of the expensive conversation endpoint.
5. **Chat messages and blog posts are not virtualized.** Long-lived sessions can grow the DOM indefinitely.
6. **The application loads all route components statically.** Route-level code splitting is currently missing.
7. **Several FastAPI routes are declared `async def` while executing synchronous SQLAlchemy/Redis calls.** That can block the event loop under concurrency.
8. **Notifications are returned unbounded.** A user with many unread notifications can receive the entire unread set on every bell refresh.
9. **The current group response model does not match the ORM shape.** Group serialization is likely to fail unless the ORM objects are manually mapped or the schema/model relationship is changed.
10. **`schema.sql` is stale compared with the ORM models.** There is no migration system, while runtime initialization uses `Base.metadata.create_all()`.

The largest performance gains should come from **fixing the state loop, reducing query count, eliminating row multiplication, bounding data, virtualizing large lists, and introducing request/data caching**. Micro-optimizations should come later.

---

## 2. What was actually validated

### Repository inventory

The ZIP contains **4,214 archive members**. The extracted repository contains approximately:

- ~4,000 SVG assets, mostly the Twemoji set
- ~59 relevant frontend source files
- ~45 relevant backend application files
- React/Vite frontend
- FastAPI + SQLAlchemy + PostgreSQL backend
- Redis-backed WebSocket infrastructure
- Boto3/S3-compatible storage integration for Cloudflare R2

### Local validation performed

- `python -m compileall -q backend/app` succeeds.
- No Git metadata was included in the ZIP, so branch/history analysis was not possible.
- A full `npm ci` did **not** complete within the available execution window, so a production Vite bundle was **not** measured. Therefore this report does not claim a measured JS bundle size.
- Backend runtime integration could not be fully executed because the local environment did not have the required PostgreSQL driver/runtime dependencies configured as a live application stack. Therefore database latency and WebSocket throughput were **not load-tested**.
- Static analysis is therefore separated from measured runtime performance.

---

# 3. Priority matrix

| Priority | Finding | Primary impact | Where |
|---|---|---|---|
| **P0** | WebSocket/message state loop | CPU spikes, repeated renders, possible UI freeze | `frontend/src/pages/ConversationPage.jsx:108-140` |
| **P0** | Group response-model mismatch | Group API correctness; can break serialization | `backend/app/models/group_member.py`, `backend/app/schemas/group.py` |
| **P0** | Schema drift/no migration source of truth | Deployment correctness + future query/index drift | `backend/app/db/schema.sql`, `backend/app/db/init_db.py` |
| **P1** | Conversation list N+1 unread counts | DB load + latency scales with conversations | `backend/app/routers/chat.py:34-86` |
| **P1** | Blog feed join multiplication | DB CPU/memory grows with engagement | `backend/app/routers/blog.py:21-52` |
| **P1** | Notification polling/refetch storm | Excess HTTP + DB + Redis traffic | `frontend/src/components/NotificationBell.jsx:19-47` |
| **P1** | Unbounded notification response | Network/payload/serialization growth | `backend/app/routers/notifications.py:11-45` |
| **P1** | Unvirtualized chat DOM | Memory/render/layout degradation in long chats | `frontend/src/pages/ConversationPage.jsx:375-412` |
| **P1** | Unvirtualized blog feed | DOM/memory growth during long sessions | `frontend/src/pages/BlogFeedPage.jsx:125-131` |
| **P1** | No route-level code splitting | Larger initial JS graph | `frontend/src/App.jsx:7-30` |
| **P1** | Sync DB calls inside async routes | Event-loop blocking under load | auth/chat/group routers |
| **P1** | WebSocket reliability/scaling design | Reconnect gaps + inefficient fanout at scale | `ws_manager.py`, `ChatSocketContext.jsx` |
| **P2** | R2 client recreated per request | Extra client setup/connection overhead | `backend/app/routers/users.py:16-27` |
| **P2** | No avatar cache policy | Repeated image transfers | users/group upload paths |
| **P2** | Login does POST + `/auth/me` | One unnecessary request per login | `frontend/src/pages/LoginPage.jsx` |
| **P2** | Full friends fetch when opening one chat | Extra network + DB work | `ConversationPage.jsx` |
| **P2** | Search sends requests for 1-char query/no cancel | Unnecessary network + stale result races | `FriendsPage.jsx`, `users.py` |
| **P2** | Weak/missing indexes for real access paths | Query degradation as tables grow | `schema.sql` + models |
| **P2** | Timestamp-only pagination cursor | Duplicate/skip edge cases | chat/blog cursors |
| **P2** | `_get_or_create_conversation()` on reads | Unexpected writes + race risk | `chat.py` |
| **P2** | Blog actions reuse expensive stats query | Extra DB work for writes/actions | `blog.py` |
| **P2** | Post comments client-side O(C²) grouping | CPU cost grows quadratically | `PostDetailPage.jsx` |
| **P3** | Twemoji repeated parsing | Rendering CPU | `textUtils.jsx` |
| **P3** | Touchmove causes React state updates | Gesture rendering overhead | `MessageBubble.jsx` |
| **P3** | Profile stats refetch after unrelated user edits | Avoidable request | `ProfilePage.jsx` |
| **P3** | Group member filter is O(F×M) | Minor client CPU | `GroupSettingsModal.jsx` |

---

# 4. Critical findings in detail

## P0-1 — `ConversationPage` has a state/effect feedback loop

### Location
`frontend/src/pages/ConversationPage.jsx:108-140`

The effect depends on:

```js
[lastMessage, friendId, messages]
```

and inside the effect it calls `setMessages()`.

The most problematic branch is:

```js
const exists = prev.find((m) => m.id === msg.id);
if (exists) {
  return prev.map((m) => m.id === msg.id ? msg : m);
}
```

`map()` always creates a new array, even when the message contents are unchanged. Because `messages` is in the dependency array, the state update changes `messages`, which runs the effect again while `lastMessage` still refers to the same event.

### Why this is severe

This is not merely an optimization opportunity. It creates a feedback loop between an effect and the state it watches.

For an incoming message in the active conversation, the sequence can become:

```text
WebSocket event
  -> lastMessage changes
  -> effect runs
  -> setMessages()
  -> messages changes
  -> effect runs again
  -> setMessages()
  -> messages changes
  -> ...
```

### Required fix

Do **not** use `messages` as an effect dependency for message application.

Use one of these patterns:

- Maintain a `conversationIdRef` and compare the incoming event against that ID.
- Maintain a `messagesRef` only when you genuinely need current messages inside the effect.
- Move WebSocket message application into a stable event handler.
- Return `prev` unchanged when the incoming message does not actually change the existing message.

Example pattern:

```js
setMessages(prev => {
  const index = prev.findIndex(m => m.id === msg.id);

  if (index === -1) return [...prev, msg];

  const existing = prev[index];
  if (existing === msg) return prev;

  const next = [...prev];
  next[index] = msg;
  return next;
});
```

The dependency strategy must also be corrected; simply changing `map()` is not enough.

---

## P0-2 — Group response schema does not match `GroupMember` ORM shape

### Locations

- `backend/app/models/group_member.py:5-19`
- `backend/app/schemas/group.py:5-34`

The ORM has:

```python
GroupMember.user
GroupMember.user_id
GroupMember.role
```

while `GroupMemberOut` expects:

```python
user_id
username
name
avatar_url
role
```

There are no direct `GroupMember.username`, `GroupMember.name`, or `GroupMember.avatar_url` attributes.

### Impact

Returning raw `Group` ORM instances under `response_model=GroupOut` cannot automatically derive those fields from the nested `user` relationship merely because `from_attributes=True` is enabled.

This is a correctness issue first and a performance issue second, because a naive fix can introduce N+1 lazy loads.

### Correct implementation

Fetch with:

```python
selectinload(Group.members).selectinload(GroupMember.user)
```

then explicitly map each member into the output schema.

Do **not** fix this by blindly touching `member.user` inside a loop without eager loading.

---

## P0-3 — Database schema is stale and there is no migration system

### Locations

- `backend/app/db/schema.sql`
- `backend/app/db/init_db.py:9-11`

`schema.sql` is missing current model structures such as the group tables and current message/group-related fields.

The runtime initializer currently uses:

```python
Base.metadata.create_all(bind=engine)
```

### Impact

This creates schema drift between:

```text
ORM models
      vs
schema.sql
      vs
production database
```

That becomes a performance problem because index changes, new constraints, and query optimizations are no longer reproducible through a proper migration history.

### Required fix

Adopt **Alembic** and make migrations the single schema evolution mechanism.

After that:

- remove reliance on `create_all()` for production deployment;
- generate a baseline migration from the current live schema;
- add explicit migration files for new indexes/columns/constraints;
- keep any human-readable schema export generated from migrations, not manually maintained.

---

# 5. Chat performance audit

## 5.1 `/chat/conversations` is an N+1 query path

### Location
`backend/app/routers/chat.py:34-86`

The endpoint correctly bulk-loads users, friendships, last messages, and read receipts, but then performs this inside the conversation loop:

```python
db.query(func.count(Message.id)).filter(...).scalar()
```

That means one count query per conversation.

There is also:

```python
await manager.is_online(friend.id)
```

inside the loop, which becomes one Redis membership check per conversation when Redis is enabled.

### Better query shape

Build one SQL query that returns, per conversation:

- conversation id
- friend id
- friend profile fields
- latest message fields
- unread count
- mute flag
- last read marker

Use a subquery/CTE for unread counts and a single query for last message.

Then perform online-state lookup separately as a batched/pipelined operation or maintain a cheap presence summary cache.

### Target complexity

Current behavior is approximately:

```text
1 + O(C) SQL queries + O(C) Redis calls
```

Target should be approximately:

```text
O(1) SQL queries + O(1) batched presence operation
```

for `C` conversations.

---

## 5.2 Chat history is bounded per request but unbounded in the browser

The initial request loads a bounded page and older messages are loaded with a cursor. That is good.

However, once older pages are appended, the browser keeps all loaded messages in `messages` and renders all of them.

### Location
`frontend/src/pages/ConversationPage.jsx:375-412`

The DOM is generated with:

```jsx
messages.map(...)
```

There is no virtualization and no hard resident-message window.

### Impact

A conversation viewed for months can accumulate thousands of nodes, which increases:

- React reconciliation work
- DOM memory
- layout/style calculation
- event listener/ref management
- text parsing work
- scrolling cost

### Additional O(M²) issue

For every message:

```js
messages.find(msg => msg.id === m.reply_to_id)
```

This creates O(M²) reply lookup work across `M` messages.

### Fix

Build a message map once:

```js
const messageById = useMemo(
  () => new Map(messages.map(m => [m.id, m])),
  [messages]
);
```

Then use:

```js
const replyMsg = messageById.get(m.reply_to_id);
```

Then add list virtualization.

Recommended architecture:

```text
React state
  -> message cache
  -> visible window
  -> virtualized rows
```

Do not render 2,000–10,000 message nodes merely because the user once scrolled through them.

---

## 5.3 WebSocket client has no reconnect strategy

### Location
`frontend/src/context/ChatSocketContext.jsx:11-19`

The current client opens one WebSocket and closes it on cleanup. There is no:

- reconnect
- exponential backoff
- jitter
- heartbeat
- connection-state UI
- reconnect deduplication

### Impact

A temporary Wi-Fi/mobile-network change can leave the application silently disconnected.

This is primarily reliability, but it also creates delayed notification synchronization and can cause subsequent HTTP refreshes to compensate for a broken socket.

### Recommended design

```text
CONNECTED
  -> disconnect/error
  -> exponential backoff
  -> CONNECTING
  -> CONNECTED
```

Use capped exponential backoff with jitter. Do not reconnect in a tight loop.

---

## 5.4 WebSocket server fanout is worker-wide

### Location
`backend/app/core/ws_manager.py:21-40`

All workers subscribe to the same Redis channel:

```text
chat_messages
```

Every worker receives each published event, then checks whether the target user exists locally.

### Scaling consequence

With `W` workers and `M` messages, the Redis-side fanout work becomes roughly proportional to:

```text
W × M
```

rather than only sending to the worker that owns the target connection.

This is acceptable for a small deployment, but it is not the final architecture for a large multi-worker service.

### Secondary problem

Messages are sent sequentially to every local socket:

```python
for ws in list(...):
    await ws.send_json(payload)
```

One slow socket can delay subsequent sends.

### Future architecture

Use connection-aware routing or per-user channels, and isolate slow socket writes with per-connection send queues/timeouts.

---

## 5.5 Group message sender duplicates REST + WebSocket paths

The sender receives the POST response and the server also sends the event over WebSocket.

That creates two possible paths for the same message to reach the sender UI:

```text
POST response -> append
                +
WebSocket event -> append/update
```

The client needs a deterministic idempotent strategy.

### Fix

Choose one authoritative path:

- optimistic message with server acknowledgement + WS dedupe, or
- append from REST and ignore the corresponding WS event for the local sender.

For large groups, batch/broadcast delivery rather than awaiting every recipient serially in one request path.

---

# 6. Blog/feed performance audit

## 6.1 Feed query can create row multiplication

### Location
`backend/app/routers/blog.py:21-52`

The query joins:

- `post_likes`
- `comments`
- `saved_posts`

at the same time.

If one post has:

```text
50 likes
20 comments
3 saves
```

the join can create an intermediate multiplicative set before the final grouping.

`COUNT(DISTINCT ...)` preserves the final count but does not remove the work required to produce the intermediate rows.

### Correct approach

Use independent aggregates/EXISTS expressions:

```text
likes_count   = scalar count(subquery)
comments_count = scalar count(subquery)
is_liked      = EXISTS(...)
is_saved      = EXISTS(...)
```

or pre-aggregate each relation in a subquery and join each result once.

This keeps each statistic close to O(number of related rows) rather than creating a combined Cartesian-like intermediate structure.

---

## 6.2 Block lookup unnecessarily materializes all block rows

### Location
`blog.py:21-27`

The code loads all viewer block rows into Python, then constructs `blocked_user_ids`.

Use a SQL `NOT EXISTS` condition directly rather than materializing the entire block set.

### Better shape

Conceptually:

```sql
WHERE NOT EXISTS (
  SELECT 1
  FROM blocks b
  WHERE (b.blocker_id = :viewer AND b.blocked_id = posts.author_id)
     OR (b.blocked_id = :viewer AND b.blocker_id = posts.author_id)
)
```

This avoids pulling unrelated rows into application memory.

---

## 6.3 Write operations call the expensive stats query

### Locations
`blog.py:65-74`, `blog.py:108-118`

Creating or updating a post performs a second stats-heavy query merely to construct the response.

Likewise, some action/validation paths reuse `_get_posts_with_stats_query()`.

### Fix

For create/update:

- return the freshly persisted post;
- initialize stats to known values;
- only calculate existing counts if the UI genuinely requires them immediately.

For like/save/comment authorization:

- use a cheap `SELECT Post ...` or `EXISTS` check;
- calculate only the exact statistic needed.

---

## 6.4 Blog feed is not resident-windowed on the client

### Location
`frontend/src/pages/BlogFeedPage.jsx:125-131`

Infinite scroll appends pages indefinitely:

```text
old posts + next page + next page + next page ...
```

No virtualization or resident-window cap exists.

### Fix

Use a virtualized feed. Keep enough data for scroll restoration, but do not keep every historical card mounted simultaneously.

---

## 6.5 Post-detail comments have client-side O(C²) grouping

The page separates top-level comments and replies and then filters the entire replies collection for each top-level comment.

For `C` comments this can approach O(C²).

### Fix

Build a map once:

```js
const repliesByParent = useMemo(() => {
  const map = new Map();
  for (const reply of replies) {
    const list = map.get(reply.parent_id) ?? [];
    list.push(reply);
    map.set(reply.parent_id, list);
  }
  return map;
}, [replies]);
```

Then use `repliesByParent.get(comment.id)`.

Also paginate comments on the backend rather than returning every comment for a large post.

---

# 7. Notification performance audit

## 7.1 Three requests every 30 seconds

### Location
`frontend/src/components/NotificationBell.jsx:19-47`

Every poll executes:

```text
GET incoming friend requests
GET all conversations
GET unread notifications
```

This happens every 30 seconds while the component is mounted.

Then an incoming `new_message` WebSocket event triggers the same three requests again.

### Why this is expensive

The second request is not cheap: `/chat/conversations` currently contains a per-conversation unread-count query and presence lookup.

Therefore the WebSocket message path can become:

```text
1 incoming message
  -> 1 WS event
  -> 3 HTTP GETs
  -> full conversation query
  -> O(C) unread count queries
  -> O(C) online checks
```

### Better architecture

Create a small summary endpoint, for example:

```text
GET /notifications/summary
```

returning only:

```json
{
  "friend_requests": 2,
  "unread_chats": 4,
  "unread_notifications": 3
}
```

Then open the bell to fetch the actual lists.

The WebSocket message should update the unread-chat count locally or request only a lightweight summary.

---

## 7.2 Closing the bell can trigger many read requests

`NotificationBell.jsx:53-75` loops through every unread conversation and calls `markAsRead()` individually.

Replace with a bulk endpoint such as:

```text
POST /chat/read-all
```

or a single endpoint accepting conversation IDs.

---

## 7.3 Notifications are unbounded

### Location
`backend/app/routers/notifications.py:11-45`

The endpoint performs:

```python
... .filter(... is_read == False) ... .all()
```

There is no limit or cursor.

### Fix

Use:

```text
limit <= 50
cursor
```

and a separate count endpoint.

Recommended DB index:

```text
(user_id, is_read, created_at DESC)
```

---

# 8. Frontend startup and bundle performance

## 8.1 All pages are statically imported

### Location
`frontend/src/App.jsx:7-30`

The application statically imports roughly 25 route components before routing them.

This prevents effective route-level code splitting.

### Recommended change

Use `React.lazy()` for route modules and a route-level `Suspense` boundary.

Example pattern:

```js
const ConversationPage = lazy(() => import('./pages/ConversationPage'));
const BlogFeedPage = lazy(() => import('./pages/BlogFeedPage'));
const FriendsPage = lazy(() => import('./pages/FriendsPage'));
```

This ensures a user visiting `/login` does not need the full chat/blog/settings route graph before the first page can become interactive.

### Important caveat

The exact bundle savings were **not measured**, because `npm ci` did not complete in the audit environment. Treat this as a high-confidence structural optimization, not a claimed MB reduction.

---

## 8.2 Heavy feature dependencies should be dynamically loaded

Conversation code imports features such as:

- emoji picker
- image cropper
- Twemoji parsing

These are chat-specific capabilities.

Load them on demand where possible:

```text
emoji button clicked
  -> dynamically import emoji-picker-react
```

and similarly for cropping.

---

# 9. Asset performance

## 9.1 Public assets are large

Measured extracted size:

```text
frontend/public       ~21 MB
frontend/public/twemoji ~19 MB
frontend/public/logo.svg ~1.66 MB
```

### Important distinction

The Twemoji directory is not automatically a 19 MB initial network download just because it exists in `public/`. Individual assets can be fetched on demand.

The logo is more immediately concerning because `logo.svg` contains a very large embedded raster image as a data URI.

### Fix

Replace the logo with:

- true vector SVG, or
- small WebP/PNG where raster is actually required.

Set explicit dimensions so the browser can reserve layout space without waiting for intrinsic-size discovery.

---

## 9.2 Twemoji rendering can be CPU-heavy

### Location
`frontend/src/utils/textUtils.jsx`

The application uses Twemoji parsing in render paths.

For a large message list, parsing identical content repeatedly can produce avoidable CPU work.

### Fix

Create a memoized pure formatter keyed by the exact source string, and make `MessageBubble` reuse the formatted representation where possible.

Do not attempt to replace Twemoji solely for file size. Measure actual network and rendering cost first.

---

# 10. Backend async/sync architecture

Several endpoints are declared `async def` but use synchronous SQLAlchemy sessions.

Examples include routes in:

- `backend/app/routers/auth.py`
- `backend/app/routers/chat.py`
- `backend/app/routers/group.py`

The database engine is created with synchronous SQLAlchemy:

```python
create_engine(...)
```

### Problem

Synchronous DB work inside an async endpoint can block the asyncio event loop while the SQL statement runs.

For a chat application with WebSockets and many concurrent requests, blocking the event loop is particularly undesirable.

### Pick one model

#### Model A — synchronous route layer

Use normal `def` route handlers for synchronous DB work. FastAPI runs them in its threadpool.

#### Model B — fully async

Migrate to:

- async SQLAlchemy engine
- async PostgreSQL driver
- `AsyncSession`
- awaited DB operations

Do not maintain a half-sync/half-async model indefinitely.

For this project, **Model A is the smaller near-term refactor** because the current codebase is already built around synchronous SQLAlchemy.

---

# 11. Database/index audit

The current SQL schema defines only a small set of indexes.

Current index examples in `backend/app/db/schema.sql:171-176` include:

```text
friend_requests(receiver_id, status)
messages(conversation_id, sent_at)
posts(author_id, status)
comments(post_id)
notifications(user_id, is_read)
blocks(blocker_id)
```

These are not enough for the application's actual access patterns.

## Recommended index set

### Friendships
Because queries use both directions:

```text
friendships(user_a_id)
friendships(user_b_id)
```

### Conversations

```text
conversations(user_a_id)
conversations(user_b_id)
```

### Messages
For 1:1 history:

```text
messages(conversation_id, sent_at, id)
```

For groups:

```text
messages(group_id, sent_at, id)
```

### Notifications

```text
notifications(user_id, is_read, created_at DESC)
```

### Blocks

```text
blocks(blocker_id, blocked_id)
blocks(blocked_id, blocker_id)
```

### Saved posts
Depending on the final query plan:

```text
saved_posts(user_id, post_id)
```

### Search
If substring search is retained:

```text
pg_trgm + GIN/GiST strategy
```

rather than expecting a normal B-tree index to accelerate:

```sql
username ILIKE '%term%'
```

### Important

Do **not** create every suggested index blindly. First run:

```sql
EXPLAIN (ANALYZE, BUFFERS)
```

against representative production-shaped datasets.

---

# 12. Pagination audit

## 12.1 Timestamp-only cursors are not fully deterministic

Chat and blog pagination currently use comparisons such as:

```python
Message.sent_at < cursor
Post.created_at < cursor
```

If two rows share the same timestamp, cursor pagination can skip or repeat an item.

### Fix

Use a tuple cursor:

```text
(sent_at, id)
```

and query:

```sql
sent_at < :ts
OR (sent_at = :ts AND id < :id)
```

with a matching composite index.

---

# 13. Conversation creation logic performs writes during reads

`_get_or_create_conversation()` can be invoked by read-like operations.

A GET that discovers no conversation can therefore insert a conversation.

### Problems

- unexpected write latency
- extra commits
- harder transaction semantics
- race condition when two requests create the same conversation concurrently

### Fix

Separate:

```text
get_conversation()
```

from:

```text
get_or_create_conversation_for_send()
```

Use a database uniqueness constraint plus PostgreSQL upsert/IntegrityError retry for the concurrent-create case.

---

# 14. R2/S3 storage path

## 14.1 Boto3 client is recreated per request

### Location
`backend/app/routers/users.py:16-27`

`get_s3_client()` constructs a new Boto3 client each time it is called.

### Fix

Create one configured client per process/application lifecycle and reuse it.

---

## 14.2 Avatar cache headers should be immutable

Profile avatar keys are UUID-like object names, so the object URL can be treated as immutable after upload.

Upload with a long-lived cache policy such as:

```text
Cache-Control: public,max-age=31536000,immutable
```

This can dramatically reduce repeated avatar downloads after the browser/edge has cached them.

---

## 14.3 Group avatar upload should use the same image pipeline as profile avatars

Profile upload already downsizes/crops to a bounded WebP image.

The group avatar path currently accepts the original file more directly.

Standardize both flows:

```text
input file
 -> client size/type check
 -> crop
 -> resize <= 500px
 -> WebP
 -> upload
```

This reduces upload bandwidth and storage size.

---

# 15. Network request audit

## 15.1 Login performs two requests

### Location
`frontend/src/pages/LoginPage.jsx`

The login flow performs:

```text
POST /auth/login
GET  /auth/me
```

when the login response could return the authenticated user alongside the token.

### Fix

Return:

```json
{
  "access_token": "...",
  "user": { ... }
}
```

Then remove the immediate `/auth/me` round trip after login.

The `/auth/me` call can still remain as the normal session hydration mechanism on browser reload.

---

## 15.2 Conversation page fetches the full friend list just to find one friend

`ConversationPage.jsx` calls the friend-list endpoint for a 1:1 conversation and then searches that array for the target friend.

### Fix

Centralize friend data in a cache or query store and reuse it across:

- conversation page
- friends page
- notification bell
- group settings

A data-cache library such as TanStack Query would materially simplify this.

---

## 15.3 Search should have a minimum query length and request cancellation

`FriendsPage.jsx` starts searches after a short debounce but allows very small query strings.

The request is not cancelled when the user types a newer query.

### Fix

Recommended behavior:

```text
< 2 or 3 chars -> no request
>= 2/3 chars -> debounce 250–350 ms
new query -> AbortController previous request
```

This avoids stale response races and reduces useless network/database work.

---

# 16. API client improvements

`frontend/src/services/api.js` is deliberately simple, but for a production app it should handle:

- request timeout
- AbortController cancellation
- 401/session-expiry handling
- safe GET-only retry logic when justified
- cache/dedupe through a query layer

Do not add blanket retries to POST/PUT/DELETE operations.

Recommended division:

```text
Axios
  -> transport concerns

TanStack Query (or equivalent)
  -> cache / dedupe / stale time / invalidation

Feature services
  -> domain-specific endpoints
```

---

# 17. Profile/image performance

The profile avatar flow converts the selected image to a data URL before cropping.

For very large source images, that creates a large temporary string in memory.

### Better flow

Use:

```text
File
 -> object URL
 -> crop canvas
 -> bounded WebP Blob
 -> upload
 -> revoke object URL
```

Also enforce:

- max source file size
- accepted MIME types
- sensible max dimensions

This protects the browser from accidentally decoding extremely large photographs.

---

# 18. Smaller frontend issues

## Message bubble memoization

`MessageBubble.jsx` uses `React.memo`, which is good, but the custom comparator must continue to account for every prop whose change can alter visual output. A comparator that ignores changing sender/reply metadata can create stale UI.

Prefer stable callback props with `useCallback()` and a simple comparator when practical rather than under-comparing props.

## Swipe gesture

`MessageBubble.jsx` updates React state during touch movement. That can produce many component renders during a swipe.

A later optimization would be:

```text
pointer/touch event
 -> requestAnimationFrame
 -> DOM transform
```

rather than a React state update for every movement.

This is **not** a first-phase optimization.

## Group member filtering

`GroupSettingsModal.jsx` checks members inside a filter loop, producing O(F×M) behavior.

Build a `Set` of member IDs once.

---

# 19. Correctness bugs that should be fixed in the performance pass

## Group conversation mobile layout

### Location
`frontend/src/pages/ChatsLayout.jsx:5-16`

The layout checks only `friendId`, but group routes use `groupId`.

Therefore the route:

```text
/chats/group/:groupId
```

is not represented in the mobile visibility logic.

Fix by checking both route parameters.

---

# 20. Database connection pool

### Location
`backend/app/db/database.py:8-10`

The engine is currently created with default pooling behavior and no explicit health checking.

For a production Postgres deployment, consider:

```python
create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=...
    max_overflow=...
)
```

The actual values must be chosen from:

```text
number of application workers
× expected concurrent DB usage
× database connection limit
```

Do **not** blindly increase the pool size. Multiple Uvicorn/Gunicorn workers multiply the effective database connection demand.

Before tuning, inspect database-side connection usage and query latency.

---

# 21. Suggested target architecture

The target architecture should be:

```text
                    Browser
                       |
          +------------+-------------+
          |                          |
       REST API                  WebSocket
          |                          |
       FastAPI ---------------- Connection Manager
          |                          |
       Service/query layer       Redis
          |
      PostgreSQL
          |
     optimized indexes

Images/files:
Browser -> signed/direct upload -> Cloudflare R2
Browser <- CDN/R2 cached immutable URLs
```

Frontend state should be split into:

```text
UI state
  modals, draft message, context menu

Server state
  conversations, notifications, friends, posts, messages

Realtime state
  WebSocket events
```

A query-cache layer should own most server-state fetching and invalidation.

---

# 22. Recommended implementation order

## Phase 0 — Fix correctness blockers

1. Fix the `ConversationPage` WebSocket dependency loop.
2. Fix `GroupOut`/`GroupMemberOut` serialization.
3. Fix mobile group route handling.
4. Introduce Alembic and reconcile current DB schema.

## Phase 1 — Highest performance impact

5. Replace `/chat/conversations` with a bounded query shape.
6. Replace blog feed join multiplication with subqueries/CTEs.
7. Add notification summary endpoint + pagination.
8. Remove notification polling/refetch storm.
9. Add route-level lazy loading.
10. Virtualize chat messages.
11. Virtualize the blog feed.
12. Build O(1) reply lookup maps.

## Phase 2 — Infrastructure

13. Decide on sync SQLAlchemy vs async SQLAlchemy and apply consistently.
14. Reuse the R2 client.
15. Add immutable cache headers to uploaded avatars.
16. Standardize group/avatar image processing.
17. Add the required DB indexes after `EXPLAIN ANALYZE` validation.
18. Add tuple cursors.
19. Add WebSocket reconnection and heartbeat.

## Phase 3 — Request/data efficiency

20. Introduce server-state caching/deduplication.
21. Remove login's extra `/auth/me` request.
22. Reuse cached friend data.
23. Cancel user-search requests.
24. Add request timeouts.
25. Remove unbounded comment/notification responses.

## Phase 4 — Micro-optimizations

26. Memoize Twemoji/formatted text output.
27. Optimize touchmove rendering.
28. Use object URLs for image previews.
29. Optimize the oversized SVG logo.
30. Investigate Twemoji packaging only after measuring its real runtime cost.

---

# 23. Performance testing plan

Do not declare the performance work complete from static inspection alone.

## Frontend measurements

Use a production build and measure:

- initial JS transfer size
- parsed/evaluated JS
- First Contentful Paint
- Largest Contentful Paint
- Total Blocking Time
- route-to-interactive time
- long-task count
- memory usage after 100 / 500 / 2,000 messages
- scroll FPS in long conversations

Test routes separately:

```text
/login
/blog
/chats
/chats/:friendId
/chats/group/:groupId
/profile
```

## API benchmarks

Benchmark at realistic dataset sizes:

### Chat

```text
10 conversations
100 conversations
1,000 conversations
```

### Messages

```text
100
10,000
100,000 per conversation
```

### Blog

```text
1k posts
10k posts
100k posts
```

### Engagement per post

```text
10 likes + 5 comments
1k likes + 500 comments
100k likes + 10k comments
```

Measure:

- p50
- p95
- p99
- DB query count/request
- database execution time
- response payload size
- CPU
- memory
- active DB connections

## Database validation

For the top 10 queries:

```sql
EXPLAIN (ANALYZE, BUFFERS)
...
```

Record the before/after plan and actual execution time.

## WebSocket benchmark

Test:

```text
100 connected users
1,000 connected users
multiple application workers
message bursts
slow clients
reconnect storms
```

Measure fanout latency and dropped/retried connections.

---

# 24. What should NOT be optimized prematurely

Avoid spending the first optimization cycle on:

- custom Vite chunk splitting before bundle measurement
- lowering bcrypt cost
- replacing every Tailwind class
- changing React state architecture everywhere
- replacing Twemoji solely because the asset folder is large
- adding Redis caching for every endpoint
- increasing PostgreSQL connection pool size without measurement
- adding dozens of indexes without `EXPLAIN ANALYZE`

The first bottlenecks are architectural and query-related, not CSS-level micro-optimizations.

---

# 25. Final checklist for implementation AI

Use this as the implementation gate:

### Correctness

- [ ] Conversation WebSocket effect no longer depends on `messages` while mutating it.
- [ ] Duplicate WebSocket messages are idempotent.
- [ ] Group output schema maps nested user information correctly.
- [ ] Group mobile routing works with `groupId`.
- [ ] DB schema is managed through migrations.

### Database

- [ ] `/chat/conversations` has no per-conversation unread query.
- [ ] Presence lookups are batched/optimized.
- [ ] Blog stats do not join likes × comments × saves into one intermediate result.
- [ ] Notifications are paginated.
- [ ] Required indexes are verified with `EXPLAIN ANALYZE`.
- [ ] Chat/blog cursors are deterministic `(timestamp, id)`.

### Frontend

- [ ] Routes are lazy-loaded.
- [ ] Emoji/cropper features are loaded on demand.
- [ ] Chat uses virtualization.
- [ ] Blog feed uses virtualization/windowing.
- [ ] Reply lookups use `Map`, not repeated array `.find()`.
- [ ] Friend/user data is cached.
- [ ] Search requests are cancellable.
- [ ] API requests have timeouts.

### Realtime

- [ ] WebSocket reconnect exists.
- [ ] WebSocket heartbeat exists.
- [ ] Slow WebSocket clients cannot block unrelated clients.
- [ ] Presence is correct across multiple workers.

### Storage/assets

- [ ] R2 client is reused.
- [ ] Avatar uploads are resized/compressed.
- [ ] Immutable cache headers are set for versioned avatar URLs.
- [ ] Oversized logo asset is replaced.

### Validation

- [ ] Production frontend build succeeds.
- [ ] Unit/integration tests cover changed query and state logic.
- [ ] Long-chat benchmark passes.
- [ ] Feed benchmark passes.
- [ ] API p95/p99 are recorded before and after.
- [ ] No new N+1 query patterns are introduced.

---

# 26. Bottom line

The project does **not** need a full rewrite for performance.

The right path is to preserve the current React/Vite + FastAPI/PostgreSQL architecture while fixing the few high-leverage structural problems:

```text
1. Fix the WebSocket state loop
2. Fix group serialization/schema drift
3. Make chat conversation loading O(1) query count
4. Make blog statistics independent aggregates
5. Stop polling/refetching entire notification state
6. Bound all unbounded APIs
7. Virtualize long lists
8. Code-split route/feature bundles
9. Make DB I/O architecture consistent
10. Add measurement + migrations + indexes
```

Those changes attack the real scaling characteristics of the current codebase. After those are implemented, profile again and then address remaining asset/rendering micro-costs based on measurements.
