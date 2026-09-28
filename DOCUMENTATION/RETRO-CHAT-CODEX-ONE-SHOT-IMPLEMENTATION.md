# RETRO CHAT — Codex One-Shot Implementation Pack

**Purpose:** Give Codex a single, execution-focused specification for taking the current RETRO CHAT repository from the uploaded/audited state to a production-ready, faster, more reliable state in one pass.

**Target agent:** GPT-5.6 Terra Ultra (or the strongest available Codex coding model)

**Operating constraint:** Token budget is limited. Do not spend the majority of the budget explaining the plan. Inspect, implement, verify, and summarize only the important results.

**Deployment topology:**
- Frontend: Cloudflare Pages
- Images/object storage: Cloudflare R2 (S3-compatible)
- Backend/API/WebSocket: Render
- Primary database: Supabase PostgreSQL
- Redis/presence/pub-sub/cache: Upstash Redis
- Repository/CI: GitHub

**Repository audit source:** `RETRO-CHAT-performance-audit.md` generated from the uploaded repository ZIP on 2026-09-28.

---

# PART 1 — MASTER CODEX PROMPT

Copy the entire section below into Codex as the main implementation request.

---

## MASTER PROMPT — RETRO CHAT PRODUCTION PERFORMANCE + RELIABILITY PASS

You are the primary senior engineer responsible for completing a production-grade optimization and reliability pass on the existing **RETRO CHAT** repository.

Do not rewrite the application from scratch. Preserve the existing product behavior, UI identity, routes, API contracts, authentication model, chat semantics, blog/social functionality, security boundaries, and deployment architecture unless a change is required to fix a verified defect.

Your job is to inspect the actual repository, compare it against the requirements below, implement the fixes, run verification after each meaningful change, and finish with a concise implementation report.

### 1. NON-NEGOTIABLE EXECUTION RULES

1. **Work from the actual repository.** Do not rely on memory, guesses, or the previous static audit alone.
2. Read `AGENTS.md` before changing code. If it does not exist, create it using the specification in PART 2.
3. Inspect the repository structure, package manifests, environment examples, build/deploy configuration, backend routers/services/models/schemas, DB configuration/migrations, frontend pages/components/hooks/context/API utilities, WebSocket code, and storage utilities.
4. Read `docs/RETRO-CHAT-performance-audit.md` when present. Treat it as a source of known findings, then re-check every finding against current code before modifying it.
5. **Do not blindly apply the audit.** Verify the current code path first. If a finding is already fixed, do not re-introduce it.
6. Preserve uncommitted user work. Never reset, hard-reset, force-checkout, or delete unrelated modifications.
7. Do not remove security checks merely to improve speed.
8. Do not expose, print, commit, or hard-code secrets.
9. Do not make destructive production database operations.
10. Do not make irreversible infrastructure changes when a local/repository-level fix is sufficient.
11. Prefer small, composable changes over a rewrite.
12. Do not add a new dependency if the same capability can be implemented reliably with the existing stack.
13. Do not introduce a new state-management framework, ORM, UI framework, queue system, or cloud provider solely for optimization.
14. Fix correctness defects before micro-optimizations.
15. For every substantial change, run the narrowest useful test/check immediately, then run the complete verification suite at the end.
16. Do not stop after discovering one issue. Continue through the entire checklist.
17. Do not ask me to manually fix obvious implementation issues. Make the change yourself when the repository and requirements provide enough information.
18. If a requirement cannot safely be implemented because external credentials/access are missing, implement all repository-side preparation possible and clearly mark the external verification as blocked.
19. Keep final output short because token budget is limited: summarize changed areas, verification results, unresolved blockers, and deployment notes only.

### 2. SUCCESS CONDITION

The task is complete only when all of the following are true:

- No known P0 correctness/performance issue remains.
- Major chat/blog/notification queries are bounded and no obvious N+1 patterns remain.
- Large frontend collections are bounded through pagination/infinite loading and/or virtualization as appropriate.
- WebSocket lifecycle is stable and does not create React effect/state feedback loops.
- Database schema evolution has a reliable migration source of truth.
- Critical PostgreSQL query paths have appropriate indexes verified against actual predicates/order/group/join usage.
- Frontend route loading is split where practical.
- Expensive repeated network requests are deduplicated, cached, cancelled, or event-driven.
- R2 usage is efficient and does not route large files through the backend unnecessarily.
- Render deployment configuration is sane for FastAPI/WebSocket/API workloads.
- Upstash Redis is used efficiently for the actual realtime/presence requirements and avoids per-request waste.
- Supabase PostgreSQL is accessed with sensible pooling/connection settings for the Render environment.
- Tests/build/lint/type checks that exist in the repository pass.
- The implementation does not regress existing product behavior.

---

# 3. DEPLOYMENT ARCHITECTURE — USE THIS AS THE REAL SYSTEM MODEL

Treat the deployed system as:

```text
                         GitHub
                            |
                      source / CI
                            |
             +--------------+---------------+
             |                              |
      Cloudflare Pages                 Render Web Service
         Frontend                          FastAPI
             |                           WebSocket/API
             |                              |
             |                    +---------+---------+
             |                    |                   |
             |              Supabase Postgres     Upstash Redis
             |                    DB             presence/cache/pubsub
             |
          Browser
             |
       image/media URLs
             |
        Cloudflare R2
```

### Architectural rules

#### Frontend — Cloudflare Pages

- Keep the frontend static/CDN-friendly.
- Do not move ordinary API processing into the frontend build layer.
- Ensure asset filenames are content-hashed where supported by the existing Vite setup.
- Avoid unnecessary runtime fetches for data that can be cached client-side.
- Use API/WebSocket endpoints against the Render service.
- Do not proxy large R2 media files through Render unless the product genuinely needs authorization at the API layer.

#### Image storage — Cloudflare R2

- R2 is the object store, not the database.
- Prefer direct browser-to-R2 uploads using signed/presigned upload mechanisms when compatible with the existing architecture.
- Keep object keys stable and predictable.
- Use correct `Content-Type` and cache metadata.
- For public/avatar media, use long-lived immutable caching when filenames/keys change on replacement.
- Avoid re-uploading the same image unnecessarily.
- Keep image size/type validation server-side even when client validation exists.
- Never expose R2 secret credentials to the browser.
- Reuse the S3-compatible client rather than recreating it for every request.

#### Backend — Render

- FastAPI handles auth, API, WebSocket, authorization, orchestration, metadata, and signed URL/upload authorization.
- Avoid blocking synchronous DB/Redis operations inside `async def` routes unless the operation is intentionally offloaded.
- Keep request handlers small; move repeated database/query logic into reusable service/repository functions where appropriate.
- Preserve WebSocket compatibility with Render's runtime.
- Add/maintain health checks and graceful shutdown behavior.
- Do not assume local filesystem persistence on Render.

#### Database — Supabase PostgreSQL

- Treat PostgreSQL as the source of truth for durable application data.
- Use parameterized queries/SQLAlchemy safely.
- Add indexes based on actual access paths, not speculation.
- Prefer keyset/cursor pagination for large append-only feeds and message histories.
- Use composite indexes that match common `WHERE + ORDER BY` paths.
- Use `EXPLAIN (ANALYZE, BUFFERS)` for the most important hot queries whenever live DB access is available.
- Keep connection pooling compatible with Render's service instance count and Supabase limits.
- Do not create a second application database.

#### Redis — Upstash Redis

Use Redis only for state that benefits from fast shared access, such as:

- presence/online status
- ephemeral connection state
- WebSocket cross-instance fanout/pub-sub if needed
- short-lived caching
- rate limiting where already appropriate

Do not use Redis as a replacement for PostgreSQL durable application state.

Avoid a Redis round-trip inside a loop when a batch/MGET/pipeline or a DB-side solution can accomplish the same thing.

If the WebSocket manager is currently process-local and the Render service can run multiple instances/workers, make cross-instance delivery explicit using Redis pub/sub or the project's existing shared realtime mechanism.

---

# 4. P0 — FIX THESE FIRST

## P0-A — ConversationPage WebSocket/message state feedback loop

Primary location:

`frontend/src/pages/ConversationPage.jsx`

Known problematic pattern:

- WebSocket/message effect depends on `messages`.
- The same effect calls `setMessages()`.
- Existing-message handling creates a new array even when no meaningful state change occurred.

### Required implementation

- Remove the state feedback dependency.
- Establish a stable event handler for incoming messages.
- Use functional state updates.
- Append new messages only once.
- For edits, update only the changed message and return the previous array if there is no actual change.
- Deduplicate by message ID.
- Preserve message order.
- Do not reconnect the WebSocket just because `messages` changed.
- Ensure changing `friendId`/conversation identity intentionally creates a new connection and cleans up the previous one.
- Ensure the effect cleanup closes the old socket/listeners.
- Add defensive handling for malformed/unknown socket payloads.

### Verification

Test:

1. Open a conversation.
2. Receive one message.
3. Verify one state insertion only.
4. Edit an existing message.
5. Verify one state replacement only.
6. Switch conversations.
7. Verify the previous socket/listener is cleaned up.
8. Return to the original conversation.
9. Verify no duplicate message listeners exist.
10. Check browser console for repeated update warnings/errors.

---

## P0-B — Fix Group response serialization correctly

Known mismatch:

`GroupMember` contains a nested `user` relationship while `GroupMemberOut` expects flattened user fields.

### Required implementation

- Eager-load nested user data using `selectinload` (or equivalent) before serialization.
- Map ORM objects explicitly into the response schema if the response is flattened.
- Do not trigger lazy loads in loops.
- Ensure group list/detail/member endpoints serialize consistently.
- Keep authorization behavior unchanged.
- Add/adjust tests for group serialization.

---

## P0-C — Establish one database migration source of truth

Known problem:

- `Base.metadata.create_all()` is being used for runtime initialization.
- The repository's `schema.sql` is stale relative to current ORM models.
- There is no reliable migration history.

### Required implementation

- Inspect whether Alembic is already partially present. Reuse it if present.
- If absent, introduce Alembic in the backend with minimal, clean configuration.
- Establish the current schema as the baseline.
- Add future index/constraint/schema changes as migrations.
- Production startup must not depend on `create_all()` silently mutating schema.
- Preserve development ergonomics without allowing production drift.
- Do not drop tables or destructive-reset production state.
- If a live Supabase connection is available through MCP, inspect actual schema before generating the baseline.

---

# 5. P1 — DATABASE AND API PERFORMANCE

## P1-A — Eliminate N+1 unread counts in `/chat/conversations`

Primary location:

`backend/app/routers/chat.py`

Known pattern:

- Fetch conversations.
- Loop through each conversation.
- Execute an unread message count query per conversation.
- Perform Redis presence checks per conversation.

### Required implementation

Replace per-conversation DB queries with a set-based query.

Preferred approach:

- aggregate unread counts in one grouped query, or
- use a correlated subquery only when it remains efficient and index-backed.

Do not issue `COUNT()` once per conversation.

For Redis presence:

- batch requests where possible;
- use MGET/pipeline or a compact presence lookup mechanism;
- do not perform sequential Redis network calls in a loop.

### Index requirements

Inspect actual SQLAlchemy models and add indexes matching the real predicates, especially around message/conversation/user/read-state columns.

Do not guess index names blindly. Use migration files.

---

## P1-B — Rewrite the blog feed aggregate strategy

Primary location:

`backend/app/routers/blog.py`

Known issue:

Likes, comments, and saves are joined together in a way that can create intermediate row multiplication.

### Required implementation

Do not join independent one-to-many tables solely to count them together.

Prefer:

- independent grouped subqueries joined once,
- correlated `EXISTS` for booleans such as `is_liked`/`is_saved`, and
- separate count subqueries/CTEs when that produces a better plan.

Ensure one logical post produces one result row without relying on massive `COUNT(DISTINCT ...)` cleanup over a multiplied join.

Use a deterministic sort such as:

```text
created_at DESC, id DESC
```

for stable pagination.

---

## P1-C — Bound all notification payloads

Primary location:

`backend/app/routers/notifications.py`

Known issue:

Unread notifications are returned without a strong bound.

### Required implementation

- Add a bounded page size.
- Use cursor or bounded page/offset semantics appropriate to existing architecture.
- Return an unread count separately if the UI needs a badge.
- Never return thousands of rows merely because they are unread.
- Keep badge count retrieval cheap.

---

## P1-D — Remove redundant NotificationBell request storms

Primary location:

`frontend/src/components/NotificationBell.jsx`

Known issue:

The component currently performs multiple requests periodically and can refresh again for each incoming WebSocket event.

### Required implementation

Create one notification-refresh orchestration path.

Rules:

- one fetch function;
- deduplicate simultaneous calls;
- don't start a second fetch while one is already in flight;
- debounce/batch WebSocket-triggered refreshes;
- use direct state updates for notification events when the socket payload contains enough information;
- use periodic refresh only as a fallback for missed events;
- keep interval cadence conservative.

Do not retain a design where a burst of 20 WebSocket events triggers 20 sets of the same API requests.

---

## P1-E — Fix expensive action endpoints

Audit blog/chat actions for accidental reuse of expensive feed/stat queries.

Examples to inspect:

- like/unlike
- save/unsave
- comment creation/deletion
- message send/edit/delete

The action endpoint should update only the necessary state and return a compact response.

Do not refetch an entire feed after every tiny mutation when local cache/state reconciliation is sufficient.

---

# 6. P1 — FRONTEND RENDERING AND MEMORY

## P1-F — Virtualize long chat message lists

Primary location:

`frontend/src/pages/ConversationPage.jsx`

The UI must support long-running chats without rendering thousands of message DOM nodes simultaneously.

### Requirements

- Preserve newest-message-at-bottom behavior.
- Preserve scroll restoration.
- Preserve loading older messages.
- Support variable message heights.
- Do not break edit/delete/reaction/sticker UI.
- Keep keyboard/mobile behavior intact.

Use an existing project-compatible virtualization solution if already installed; otherwise add the smallest stable dependency only if required.

Do not virtualize the input/composer itself.

---

## P1-G — Bound/virtualize the blog feed

Primary location:

`frontend/src/pages/BlogFeedPage.jsx`

Implement feed pagination/infinite loading and avoid a permanently growing DOM.

Rules:

- Fetch a bounded batch.
- Use the API's cursor if available.
- Stop when no next cursor remains.
- Avoid duplicate posts when loading the next page.
- Avoid replacing the entire feed for a local like/save mutation.
- Preserve scroll position.

---

## P1-H — Route-level code splitting

Primary location:

`frontend/src/App.jsx`

Lazy-load page modules that do not need to be in the initial JS graph.

Typical candidates:

- profile
- settings
- friends
- blog feed/detail
- conversation
- group management
- other authenticated secondary pages

Use React lazy/Suspense or the project's existing router-level lazy mechanism.

Do not introduce loading flicker for tiny components; code-split large route boundaries.

---

## P1-I — Avoid repeated expensive text/emoji formatting

Inspect the Twemoji/text formatting path.

Use memoization/caching at the right boundary rather than performing full parsing repeatedly for unchanged messages.

Do not memoize everything blindly. Memoize expensive deterministic transforms whose input is stable.

---

# 7. P1 — ASYNC/CONCURRENCY CORRECTIONS

Audit every FastAPI route under the backend routers.

Known concern:

Several handlers are `async def` while calling synchronous SQLAlchemy/Redis methods.

### Required rule

Choose one coherent strategy per dependency:

- If using synchronous SQLAlchemy Session + blocking Redis client, use normal `def` request handlers where appropriate so the framework can safely manage blocking work in its threadpool.
- If the project is intended to be fully async, migrate the relevant path to async SQLAlchemy/Redis consistently.

Do not leave expensive blocking I/O running directly in the event loop by accident.

Do not perform a huge async migration merely for style. Fix the actual concurrency issue with the smallest safe change.

---

# 8. P1 — WEBSOCKET RELIABILITY AND SCALING

Inspect:

- backend WebSocket manager
- connection lifecycle
- heartbeat/ping strategy
- reconnect behavior
- client cleanup
- Redis/pub-sub integration
- multi-instance Render behavior

### Required behavior

- client detects closed connections;
- reconnect uses bounded exponential backoff with jitter;
- stop reconnecting after intentional logout/navigation when appropriate;
- server removes dead connections;
- heartbeat/ping/pong is present where needed;
- duplicate socket/listener registration is impossible;
- incoming messages are deduplicated by stable identifiers;
- cross-instance fanout is supported through Upstash Redis if Render horizontally scales and process-local state is insufficient.

Avoid infinite reconnect tight loops.

---

# 9. P2 — CLOUDFLARE R2 + IMAGE DELIVERY

Inspect every profile/group/media upload path.

### Required implementation

1. Reuse the R2/S3-compatible client.
2. Validate MIME type and file size server-side.
3. Prevent object-key collisions.
4. Prefer immutable/versioned object keys when replacement caching is needed.
5. Set cache metadata appropriate to the asset lifecycle.
6. Keep public delivery direct from R2/CDN where product security permits.
7. Do not stream R2 objects through Render merely to display a public avatar.
8. Generate presigned upload URLs when that architecture fits the current API.
9. Ensure failed uploads do not leave broken database references.
10. Ensure deleted images are cleaned up when the application's deletion policy allows it.
11. Never expose R2 access key/secret in frontend code.
12. Avoid converting already-optimized images repeatedly.

### Image optimization

- Inspect actual upload code before choosing transformations.
- For avatars, enforce sensible maximum dimensions/bytes.
- Prefer storing a correctly sized derivative when the feature needs it.
- Do not add an image-processing library if Cloudflare-side processing or existing tooling already provides the needed capability.

---

# 10. P2 — AUTH + REQUEST REDUCTION

## Login flow

If login currently performs:

```text
POST /auth/login
GET /auth/me
```

and the backend can safely return the authenticated user in the successful login response, remove the unnecessary second request.

Do not compromise cookie/session security.

## Conversation page friend lookup

Avoid fetching the entire friend list solely to obtain one friend's profile if a dedicated user/conversation endpoint already exists or can be created cheaply.

Prefer a bounded targeted lookup.

## Search

- require a practical minimum query length (for example 2 or 3 characters when consistent with existing UX);
- debounce input;
- cancel stale requests with `AbortController` or equivalent;
- ignore stale responses;
- cap results.

---

# 11. P2 — PAGINATION CORRECTNESS

Audit every feed/message endpoint.

Use deterministic cursor tuples such as:

```text
(created_at, id)
```

rather than timestamp-only cursors when records can share timestamps.

The next-page predicate must implement strict tuple ordering so that records are neither skipped nor duplicated.

Apply this to:

- chat history
- blog feed
- notifications
- comments where pagination exists
- friend/user search results if cursor-based pagination is appropriate

---

# 12. P2 — CLIENT-SIDE DATA CACHING / DEDUPLICATION

Do not introduce a huge state-management migration purely for caching.

First inspect the existing context/hooks/API utility architecture.

Implement a lightweight request cache/deduplication layer where repeated data is currently fetched unnecessarily.

Good candidates:

- current user
- friends
- notification summary
- conversations
- profile metadata
- group metadata

Rules:

- avoid duplicate simultaneous requests;
- use stale-while-revalidate behavior only where it fits UX;
- invalidate targeted resources after mutations;
- avoid global invalidation that refetches the entire application.

---

# 13. P2 — DATABASE INDEXING

Inspect all current PostgreSQL queries and model relationships before adding indexes.

Hot access paths likely include combinations around:

- messages by conversation + creation time
- unread messages by recipient/conversation/read state
- conversations by participant
- posts by creation time
- likes by user/post
- saves by user/post
- comments by post/creation time
- notifications by recipient/read/creation time
- friend requests by recipient/status
- group membership by group/user

### Index rules

- create indexes via Alembic migration;
- avoid redundant duplicate indexes;
- account for unique constraints that already create indexes;
- verify important query plans with EXPLAIN ANALYZE when possible;
- do not add an index just because a column exists.

---

# 14. P2 — POSTGRES CONNECTION MANAGEMENT WITH SUPABASE

Inspect SQLAlchemy engine/session configuration.

Goals:

- sensible pool size for Render instance count;
- appropriate overflow behavior;
- connection recycling/health checks where justified;
- transaction scope kept short;
- no connection leak;
- no unnecessary connection creation per request.

Because Supabase is the managed database, do not assume the connection behavior of a local PostgreSQL server.

If the project has access to Supabase pooling/transaction-pool URLs, evaluate whether the application's SQLAlchemy strategy should use the appropriate connection endpoint.

Do not change production connection settings blindly without checking current deployment configuration.

---

# 15. P2 — REDIS / UPSTASH OPTIMIZATION

Inspect every Redis call.

Rules:

- no sequential per-item Redis network calls when batch/pipeline is possible;
- no unnecessary presence writes on every UI render;
- use TTLs for ephemeral values;
- avoid large values;
- do not store durable application data only in Redis;
- gracefully handle Redis timeouts without taking down the entire request path;
- do not turn Redis outages into catastrophic authentication/database failures unless the current security model requires strict dependency.

If Redis is used for WebSocket fanout, namespace channels/keys clearly and clean up ephemeral state.

---

# 16. P3 — LOWER-PRIORITY FRONTEND OPTIMIZATIONS

Apply these only after P0/P1/P2 issues are handled.

### Text / Twemoji

Memoize expensive deterministic parsing.

### Touch gestures

Avoid continuous React state updates on every `touchmove` if the value is only needed for visual transforms; use refs/CSS transforms/requestAnimationFrame where appropriate.

### Image preview

Use object URLs for local previews instead of unnecessary base64 duplication when compatible with current code.

Revoke object URLs when no longer needed.

### Profile statistics

Do not refetch profile stats after unrelated metadata edits.

### Group settings filters

Avoid repeated O(F×M) filtering when a Set/Map can reduce it to near O(F+M).

### Large assets

Inspect oversized assets. In particular, check whether the logo and Twemoji assets can be reduced or loaded on demand without breaking the existing visual identity.

Do not delete the Twemoji set if the product depends on it. Make delivery/load behavior efficient instead.

---

# 17. TESTING AND VERIFICATION LOOP

You must use this loop repeatedly:

```text
INSPECT
  ↓
IMPLEMENT ONE COHERENT CHANGE
  ↓
RUN TARGETED TEST / LINT / TYPE CHECK
  ↓
INSPECT DIFF
  ↓
CHECK FOR SIDE EFFECTS
  ↓
MOVE TO NEXT CHANGE
```

At the end:

```text
RUN BACKEND TESTS
RUN FRONTEND TESTS
RUN LINT
RUN TYPECHECK (if configured)
RUN PRODUCTION BUILD
RUN MIGRATION CHECKS
RUN PYTHON COMPILE CHECK
START LOCAL STACK IF FEASIBLE
VERIFY CRITICAL FLOWS
```

### Critical browser flows to verify

1. Login/logout.
2. Friend request.
3. Conversation open.
4. Send message.
5. Receive realtime message.
6. Edit message.
7. Delete message.
8. Load older messages.
9. Switch conversations repeatedly.
10. Notification arrival.
11. Notification read/clear behavior.
12. Blog feed initial load.
13. Blog pagination/infinite loading.
14. Like/save/comment.
15. Profile avatar upload.
16. Group avatar upload.
17. Group creation/member loading.
18. Search with rapid typing.
19. Mobile navigation.
20. Page reload/deep-link routing.

### Performance checks

Where tools allow measurement, compare before/after for:

- initial JS loaded
- route chunk sizes
- number of HTTP requests on first load
- number of requests on conversation open
- number of DB queries for conversation list
- number of DB queries for blog feed
- notification refresh requests
- chat render count/DOM size during long conversations
- feed DOM size after long scrolling
- API latency p50/p95 where observable
- WebSocket reconnect behavior

Do not invent numbers. If a measurement is unavailable, say `not measured`.

---

# 18. BROWSER VERIFICATION

When an agent-browser/browser MCP is available, use it.

Recommended checks:

- load deployed frontend;
- check console errors;
- inspect network waterfalls;
- inspect route loading;
- test login/chat/blog/profile/group flows;
- simulate long lists;
- verify no repeated identical requests;
- verify WebSocket reconnect behavior;
- verify image requests go directly to the intended CDN/R2 path where appropriate.

Use browser automation for verification, not for replacing source-code reasoning.

---

# 19. EXTERNAL MCP / LIVE INFRASTRUCTURE VERIFICATION

When the relevant MCP is actually connected and authorized, use it for evidence rather than guessing.

### GitHub MCP — USE

Use for:

- repository state
- current branch/commit
- CI workflows
- pull requests/issues if relevant
- changed-file comparison
- repository-level verification

### Supabase MCP — USE

Use for:

- inspecting live schema
- verifying indexes
- checking migrations
- checking PostgreSQL query behavior when supported
- verifying the database state after schema changes

Do not expose database secrets in output.

### Render MCP — USE

Use for:

- service status
- deploy status
- runtime logs
- environment configuration inspection where permitted
- resource/health verification
- deploy validation

Do not change production environment variables unless specifically necessary and safe.

### Upstash Redis MCP — USE

Use for:

- inspecting Redis configuration/state when supported
- validating key/TTL usage
- checking whether realtime/cache patterns match the implementation
- troubleshooting Redis-related performance issues

Do not dump private user/session values into chat.

### Cloudflare / R2

A dedicated Cloudflare MCP is not assumed to be available in this environment. If the Codex environment has an authorized Cloudflare MCP, use it for Pages/R2 inspection. Otherwise use the repository's Cloudflare configuration and available CLI/API tooling (for example Wrangler) without inventing credentials.

### Browser

Use agent-browser/browser verification if available.

---

# 20. WHAT NOT TO DO

Do NOT:

- rewrite React into another framework;
- rewrite FastAPI into another backend;
- replace Supabase/Postgres with another DB;
- replace Upstash Redis with another cache;
- replace Cloudflare R2 with another object store;
- add Docker solely for optimization if the current deployment does not require it;
- add GraphQL solely for performance;
- add WebSockets to areas that do not need realtime behavior;
- replace SQLAlchemy solely because query code can be optimized;
- remove pagination;
- remove security validation;
- disable authentication checks;
- store secrets in frontend code;
- introduce aggressive polling;
- perform unbounded `SELECT *` operations for user-facing feeds;
- silently swallow exceptions;
- catch every exception and return HTTP 200;
- use Redis as durable storage;
- make arbitrary production database changes without a migration;
- claim performance gains without measurements or code evidence.

---

# 21. FINAL OUTPUT FORMAT FOR CODEX

Do not provide a long essay.

Return only:

## Implemented
- grouped list of completed fixes

## Verification
- tests
- lint
- typecheck
- build
- migration checks
- browser/runtime checks

## Measurements
- only real measured before/after values
- explicitly mark unavailable measurements as `not measured`

## Remaining blockers
- only genuine blockers

## Deployment notes
- concise notes for Cloudflare Pages / Render / Supabase / Upstash / R2

---

# PART 2 — AGENTS.md

Create or update the repository-root `AGENTS.md` with the following content. Keep it concise enough to be loaded often, but strict enough to enforce the engineering workflow.

```md
# RETRO CHAT — AGENTS.md

## Project

RETRO CHAT is a production social/chat application.

Deployment:
- Frontend: Cloudflare Pages
- Backend/API/WebSocket: Render
- PostgreSQL: Supabase
- Redis: Upstash Redis
- Object/media storage: Cloudflare R2
- Repository/CI: GitHub

## Repository rules

1. Read this file before modifying code.
2. Preserve existing user work and product behavior.
3. Do not rewrite architecture without evidence.
4. Do not remove security controls for performance.
5. Never commit secrets.
6. Never expose API keys, database credentials, R2 credentials, Redis credentials, or JWT secrets.
7. Never perform destructive production DB operations without explicit authorization.
8. Prefer minimal, targeted changes.
9. Use existing dependencies before adding new ones.

## Performance rules

- No unbounded user-facing queries.
- No obvious N+1 database queries.
- No accidental effect/state feedback loops in React.
- No repeated API request storms.
- Large lists must use bounded pagination and/or virtualization as appropriate.
- Prefer deterministic cursor pagination for large feeds/messages.
- Do not perform blocking synchronous I/O directly inside async event-loop paths.
- Batch Redis operations whenever possible.
- Reuse storage/database clients where appropriate.
- Avoid routing large R2 objects through the Render API unnecessarily.
- Add indexes only when tied to actual query predicates/order/join usage.
- Verify important PostgreSQL changes with EXPLAIN ANALYZE when available.

## WebSocket rules

- A component must not reconnect because normal message state changed.
- Every socket/listener must have deterministic cleanup.
- Incoming messages must be deduplicated by stable IDs.
- Reconnect uses bounded exponential backoff with jitter.
- Dead server-side connections must be removed.
- Cross-instance fanout must use shared infrastructure when horizontal scaling requires it.

## Database rules

- Alembic migrations are the schema source of truth.
- Do not rely on create_all() for production schema evolution.
- Keep transactions short.
- Prefer set-based SQL over loops of database queries.
- Avoid unnecessary SELECT *.
- Use composite indexes for real hot paths.

## Frontend rules

- Avoid unnecessary React state updates.
- Memoize expensive deterministic transformations when beneficial.
- Lazy-load large route-level modules.
- Use AbortController or equivalent for stale search/request cancellation.
- Avoid rendering thousands of DOM nodes simultaneously.
- Preserve responsive behavior and existing design.

## R2 rules

- R2 credentials never reach browser code.
- Validate file type and size server-side.
- Use cache-friendly immutable keys when appropriate.
- Clean up abandoned/orphan objects when safely possible.
- Prefer direct CDN/R2 delivery for public assets.

## Redis rules

- Redis is for ephemeral/shared-fast state, not durable source-of-truth data.
- Use TTLs for ephemeral keys.
- Avoid sequential network calls in loops.
- Prefer MGET/pipelines/batched operations.
- Redis failure should degrade gracefully where security/business rules permit.

## Implementation workflow

For every coherent change:

1. Inspect relevant code.
2. Identify the root cause.
3. Implement the smallest correct fix.
4. Run targeted tests/checks.
5. Inspect the diff.
6. Check related call sites and regressions.
7. Continue to the next issue.

At the end run the complete available verification suite.

## Evidence standard

Do not claim an optimization worked unless:
- it is demonstrably correct from code/query analysis, or
- it was measured with a real before/after test.

Never invent benchmark numbers.

## Scope discipline

Optimize in this order:

1. Correctness/P0 defects
2. Database/query count
3. Network/request count
4. Unbounded rendering/data
5. Concurrency/realtime reliability
6. Storage/image delivery
7. Code splitting/caching
8. Micro-optimizations

## Final response

Return only:
- implemented changes
- verification results
- real measurements
- blockers
- deployment notes

Do not write a long narrative.
```

---

# PART 3 — SKILLS TO ENABLE / USE

Use only the skills that materially help this repository. More skills are not automatically better, especially with a limited token budget.

## REQUIRED / HIGH VALUE

### 1. Supabase base skill

`skills://plugins/supabase/supabase`

Use whenever the task touches Supabase PostgreSQL, schema, migrations, SQL, RLS, connection behavior, or query optimization.

### 2. Supabase Postgres best practices

`skills://plugins/supabase/supabase-postgres-best-practices`

Use for:
- PostgreSQL query optimization
- schema/index design
- EXPLAIN ANALYZE reasoning
- avoiding inefficient joins/subqueries
- connection/query best practices

### 3. Render MCP skill

`skills://plugins/app-6a624c56bfe081918f7544f7d58f6faf/render-mcp`

Use if Render MCP is not configured yet or needs troubleshooting.

### 4. Render debug

`skills://plugins/app-6a624c56bfe081918f7544f7d58f6faf/render-debug`

Use for live deployment/runtime debugging, logs, crashes, environment problems, or performance symptoms on Render.

### 5. Render monitor

`skills://plugins/app-6a624c56bfe081918f7544f7d58f6faf/render-monitor`

Use for service health, metrics, runtime performance, and deployment verification.

### 6. Render environment variables

`skills://plugins/app-6a624c56bfe081918f7544f7d58f6faf/render-env-vars`

Use only when checking/fixing backend runtime configuration.

### 7. Browser automation

`skills://plugins/vercel/agent-browser`

Use for real browser verification of the deployed/local frontend.

### 8. Browser verification

`skills://plugins/vercel/agent-browser-verify`

Use when available after starting the frontend/dev server or during final UI verification.

## OPTIONAL / CONDITIONAL

### Cloudflare security skills

If Cloudflare account/Pages/R2 security is explicitly part of the task, these skills are useful:

- `skills://plugins/cloudflare-security/storage-and-binding-security`
- `skills://plugins/cloudflare-security/workers-pages-security`
- `skills://plugins/cloudflare-security/headers-cors-cache-security`
- `skills://plugins/cloudflare-security/secrets-and-api-leak-prevention`

Use them for security validation, not as a replacement for application performance work.

### Render scaling

`skills://plugins/app-6a624c56bf.../render-scaling`

Use only when actual Render instance scaling/autoscaling is being investigated.

### Render CLI

`skills://plugins/app-6a624c56bf.../render-cli`

Use when direct Render CLI access is needed. Prefer the exact installed skill URI exposed by the environment rather than guessing a URI.

### OpenAI Developers

Only use OpenAI Developers tooling if RETRO CHAT itself integrates OpenAI APIs/Agents/SDK. Do not activate it merely because Codex is being used.

---

# PART 4 — MCP / CONNECTOR PRIORITY

With a constrained token budget, connect only the systems that directly correspond to RETRO CHAT's production topology.

## Priority A — absolutely useful

| MCP / Connector | Why |
|---|---|
| **GitHub** | Live repository, branches, diffs, PRs, CI, source of truth |
| **Supabase** | Live Postgres schema/index/migration/query verification |
| **Render** | Backend health, logs, deploy/runtime verification |
| **Upstash Redis** | Redis/presence/cache/realtime verification |
| **Browser / agent-browser** | Real frontend verification, console/network/runtime checks |

## Priority B — useful when needed

| MCP / Connector | Why |
|---|---|
| **Cloudflare** | Pages/R2 verification if a supported connector exists in the Codex environment |
| **OpenAI Developers** | Only if the application uses OpenAI APIs |

## Do NOT prioritize

- Canva
- Figma
- WordPress
- Vercel deployment tooling
- generic analytics tools
- unrelated SaaS connectors

They do not materially improve this engineering pass.

---

# PART 5 — LIVE INFRASTRUCTURE CHECKLIST

Before declaring completion, inspect what can safely be inspected through connected MCPs.

## GitHub

- current branch
- working tree status
- package/dependency files
- CI workflows
- latest commit
- migration files
- frontend/backend build scripts

## Supabase

- actual schema
- indexes
- tables/relationships
- migration state if supported
- row counts for major tables if useful
- query plans for hot endpoints when supported

## Render

- backend service health
- recent deploy status
- runtime logs
- CPU/memory symptoms where available
- environment configuration names (do not print secret values)
- health endpoint
- WebSocket runtime behavior if observable

## Upstash

- relevant key namespaces
- TTL behavior
- connection/configuration state
- whether presence/cache keys are exploding in volume
- whether fanout keys/channels match the implementation

## Cloudflare

If connected:

- Pages deployment status
- cache behavior
- R2 bucket/object metadata policy
- public/private delivery model
- CORS for R2 uploads if applicable
- cache-control headers

---

# PART 6 — EXPECTED FILE / CODE AREAS TO AUDIT

Do not assume exact filenames if the current repository has changed; locate the current equivalents.

### Frontend

- `frontend/src/App.jsx`
- `frontend/src/pages/ConversationPage.jsx`
- `frontend/src/pages/BlogFeedPage.jsx`
- `frontend/src/pages/PostDetailPage.jsx`
- `frontend/src/components/NotificationBell.jsx`
- `frontend/src/components/MessageBubble.jsx`
- `frontend/src/pages/ProfilePage.jsx`
- `frontend/src/pages/FriendsPage.jsx`
- `frontend/src/components/GroupSettingsModal.jsx`
- API/context/hooks utilities
- WebSocket context/manager
- Vite/build configuration

### Backend

- `backend/app/routers/chat.py`
- `backend/app/routers/blog.py`
- `backend/app/routers/notifications.py`
- `backend/app/routers/users.py`
- group routers/services
- auth routers/services
- DB engine/session configuration
- SQLAlchemy models
- Pydantic schemas
- WebSocket manager
- Redis utilities
- R2/S3 utilities
- startup/init configuration
- migration configuration

### Deployment/configuration

- `render.yaml` if present
- Cloudflare Pages/build configuration if present
- Vite config
- environment examples
- CORS configuration
- API base URL configuration
- WebSocket URL derivation
- R2 configuration
- Redis URL/configuration
- PostgreSQL connection configuration
- CI workflows

---

# PART 7 — KNOWN FINDINGS FROM THE 2026-09-28 AUDIT

Treat these as a starting checklist, not unquestionable truth. Verify them against current code before changing anything.

### P0

- Conversation WebSocket effect/state feedback loop.
- Group output schema vs `GroupMember` relationship mismatch.
- Stale manual schema + no migration source of truth.

### P1

- `/chat/conversations` unread-count N+1.
- Per-conversation Redis presence lookups.
- Blog feed join multiplication for likes/comments/saves.
- Notification polling + WebSocket refresh storm.
- Unbounded notifications payload.
- Unvirtualized long chat message DOM.
- Unvirtualized long blog feed DOM.
- Static route imports / missing route-level code splitting.
- Blocking sync DB/Redis operations in async routes.
- WebSocket reconnect/multi-instance concerns.

### P2

- R2 client recreated per request.
- Missing/weak cache headers for user media.
- Login followed by extra `/auth/me` request.
- Fetching all friends to resolve one conversation target.
- Search request cancellation/debounce gaps.
- Timestamp-only cursor risk.
- Potentially unnecessary writes in read paths.
- Action endpoints reusing expensive feed/stat queries.
- Profile stats refetch after unrelated edits.
- Client-side comment grouping can become O(C²).
- Touchmove-driven React state updates.
- Large asset/logo efficiency.

---

# PART 8 — ONE-PASS EXECUTION SEQUENCE

Use this exact high-level order to minimize token waste while keeping the fixes safe.

```text
STEP 1
Read AGENTS.md + audit + repository tree

STEP 2
Inspect Git status and deployment/config files

STEP 3
Fix P0 frontend WebSocket state loop
→ targeted frontend verification

STEP 4
Fix group serialization
→ targeted backend verification

STEP 5
Establish/repair Alembic migration source of truth
→ migration validation

STEP 6
Rewrite chat conversations query path
→ query-count/query-shape validation

STEP 7
Rewrite blog aggregate query path
→ SQL/query validation

STEP 8
Bound notifications + remove notification request storm
→ frontend/backend validation

STEP 9
Add/verify pagination and deterministic cursors

STEP 10
Virtualize/bound chat + blog lists

STEP 11
Lazy-load large routes

STEP 12
Fix async/sync blocking paths

STEP 13
Harden WebSocket reconnect/cleanup/multi-instance behavior

STEP 14
Optimize R2 client reuse + media caching/upload path

STEP 15
Optimize Supabase DB pooling and indexes

STEP 16
Optimize Upstash Redis batching/TTL/fanout where needed

STEP 17
Fix secondary request duplication/search cancellation/client caching

STEP 18
Run complete tests/lint/typecheck/build

STEP 19
Browser verification

STEP 20
Live MCP verification where available

STEP 21
Final diff review + concise summary
```

Do not spend equal effort on every item. P0/P1 issues receive priority.

---

# PART 9 — DEFINITION OF DONE

RETRO CHAT is considered complete for this pass when:

- active chat does not create a state/effect loop;
- switching conversations does not leak WebSockets/listeners;
- message history is bounded/virtualized and paginated;
- conversation list does not perform one SQL count per row;
- blog feed does not multiply independent engagement tables unnecessarily;
- notifications are bounded and refreshes are deduplicated;
- large page modules are split from the initial bundle where useful;
- synchronous blocking I/O is not accidentally executed on the async event loop;
- R2 delivery/upload is efficient and secure;
- Supabase schema changes are migration-based;
- key indexes match real hot queries;
- Upstash Redis is batched and TTL-governed where appropriate;
- WebSocket reconnect and multi-instance behavior is sane;
- critical user journeys still work;
- tests/build/lint/typecheck available in the repo pass;
- deployment-specific checks have been performed where credentials/MCPs permit;
- no secrets were exposed or committed;
- final response contains only concrete implementation/verification information.

---

# END OF IMPLEMENTATION PACK
