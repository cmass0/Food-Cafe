# Cursor to Offset/Page Migration Manual (Verified)

Goal: convert the repository from cursor-based pagination (`nextCursor`/`cursor`) to page+offset pagination. The checklist below records the completed work.

## Completion Summary
- Completed: Domain types and Zod schemas expose `limit/page/offset` filters and return `{ items, total, limit, offset, hasMore }`.
- Completed: Repositories rely on `range(offset, offset + limit - 1)` with `count: 'exact'` to fetch rows and totals.
- Completed: Services compute offsets from `page` or `offset`, drop cursor utilities, and set `hasMore = offset + items.length < total`.
- Completed: API routes, client fetch wrappers, and `/posts` UI read/write `page` and `limit` parameters and render the new pagination component.
- Completed: Documentation (`prompts/*`, `.taskmaster/tasks/tasks.json`) references offset/page pagination, and `rg -n '(nextCursor|parseCursor|encodeCursor|\bcursor\b)' src --glob '!.*/ui/*'` confirms no cursor remnants.

## Touched Areas (by layer)
- **API routes:** `src/app/api/posts/route.ts`, `src/app/api/recipes/route.ts`, `src/app/api/users/route.ts`
- **Pages / UI:** `src/app/posts/page.tsx`, `src/components/pagenation/pagenation.tsx`
- **Post feature:** `src/features/post/{api,repository,service,types}.ts`
- **Recipe feature:** `src/features/recipe/{api,repository,service,types}.ts`
- **User feature:** `src/features/user/{api,repository,service,types}.ts`
- **Comment foundations:** `src/features/comment/{repository.ts,repository.server.ts,types.ts}`
- **Docs & logs:** `.taskmaster/tasks/tasks.json`, `prompts/comment-migration-manual.md`, `prompts/user-supabase-migration.md`

## Mandatory Change Order
1. Types / Schemas
2. Repository
3. Service
4. API Routes
5. Feature API (client fetch wrappers)
6. Pages / UI
7. Documentation / task logs

## Layer Checklists

### 1) Types / Schema
- Remove cursor-related types (`*CursorFilter`, `nextCursor`, raw `cursor` strings).
- Accept `limit`, `page`, `offset` plus existing filters (`writerUid`, `type`, `search`, etc.).
- Response types expose `{ items, total, limit, offset, hasMore }`.

### 2) Repository (Supabase queries)
- Replace cursor filters with `range(offset, offset + limit - 1)`.
- Select with `count: 'exact'` to retrieve totals alongside rows.
- Preserve ordering strategy (`created_at DESC`, `id ASC`) and extend indexes when required.

### 3) Service (business logic)
- Remove `parseCursor` / `encodeCursor` helpers.
- Derive `offset` from provided `offset` or `(page - 1) * limit`.
- Map rows to domain models and compute `hasMore` from totals.

### 4) API Routes (server handlers)
- Parse `page`, `limit`, and optional `offset` query params.
- Forward values to services and return the new response envelope.
- Drop all cursor parsing / encoding.

### 5) Feature API (client fetch wrappers)
- Emit `page`, `limit`, `offset`, and other filters via query string.
- Expect `{ items, total, limit, offset, hasMore }` responses.
- Remove cursor serialization.

### 6) Pages / UI
- Replace `searchParams.cursor` usage with `page` / `limit`.
- Generate navigation links as `?page=...&limit=...` plus other filters.
- Update pagination component to accept `{ page, pageSize, total, basePath, query }`.

### 7) Documentation / Task Log
- Update prompt manuals and task notes to reference offset/page pagination.
- Record verification command outputs when closing the task.

## Validation Notes
- `rg -n '(nextCursor|parseCursor|encodeCursor|\bcursor\b)' src --glob '!.*/ui/*'`
- Exercise API calls to confirm totals and `hasMore` align with page maths.
- Monitor Supabase `count: 'exact'` cost; consider caching or hybrid strategies for very large datasets.

## Trade-offs Recap
- **Pros:** sharable URLs, simpler implementation, server and client symmetry.
- **Cons:** `count: 'exact'` overhead, offset pagination sensitivity to insert churn (consider "Load more" UX for very hot lists).
