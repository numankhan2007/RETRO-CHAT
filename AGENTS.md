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
