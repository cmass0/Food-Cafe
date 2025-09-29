# Recipe Supabase Migration Guide (4 Parts)

This checklist tracks the Firebase -> Supabase migration for the recipe domain. Each part should be completed in order.

## Reference Structure
- `src/lib/supabase/{browser.ts, server.ts}`
- `src/features/recipe/{types.ts, schema.ts, repository.ts, service.ts, ui/*}`
- `src/app/recipes/{page.tsx, new/page.tsx, [id]/page.tsx, actions.ts}`
- `src/middleware.ts` (optional)

## Common Items
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- DB/RLS health check: ensure `recipes/users/posts/comments` tables have RLS enabled with expected policies

---

## 1) lib - Supabase Client Wrappers
**Goal**
- Provide shared browser/server Supabase clients while honoring session-based RLS.

**Implementation Notes**
- `browser.ts`: singleton `createBrowserClient` using public anon key.
- `server.ts`: `createServerClient` with Next.js cookies bridge; middleware/server action friendly.

**Verification**
- Anonymous SELECT succeeds from server components.
- Authenticated mutations (create/update/delete) succeed while anonymous requests are rejected (401/403).

**Checklist**
- [ ] Browser client hides service keys and only exposes anon usage.
- [ ] Server environment blocks direct writes from unauthenticated contexts.

---

## 2) features/recipe - Domain Layer / Validation / Service / UI
**Goal**
- Move recipe domain logic into Supabase-aware modules with validation and layered architecture.

**Implementation Summary**
- `types.ts`: Supabase schema aligned types (`RecipeRow`, `RecipeInsert`, `RecipeUpdate`, etc.).
- `schema.ts`: Zod validation for payloads (lengths, URLs, enums).
- `repository.ts`: Supabase data access with RLS-safe queries (`list`, `get`, `create`, `update`, `remove`).
- `service.ts`: Orchestrates validation, legacy id handling, tag/image normalization.
- `ui/*`: Server list, client form, and display card scaffolding.

**Verification**
- Repository API supports SELECT/INSERT/UPDATE/DELETE plus failure paths for unauthorized access.
- Service layer blocks invalid inputs and propagates friendly errors.

**Checklist**
- [x] SELECT & mutations run under RLS-friendly policies.
- [x] Cursor pagination (`created_at DESC, id ASC`) implemented.
- [x] Required indexes confirmed (existing schema sufficient).

---

## 3) app/recipes - App Router Pages & Server Actions
**Goal**
- Serve SSR pages and server actions that exercise Supabase with proper session forwarding.

**Implementation Summary**
- `page.tsx`: SSR list page using Supabase service + `RecipeList` component.
- `new/page.tsx`: Create workflow with client form calling `createRecipeAction`.
- `[id]/page.tsx`: Detail page with edit form & delete button wired to server actions.
- `actions.ts`: `create/update/remove` server actions leveraging `lib/supabase/server` and revalidation.

**Verification**
- Anonymous users can read lists but cannot mutate; server actions respect RLS (manual login test required later).
- Successful mutations redirect or refresh appropriately; errors propagate back to the client form.

**Checklist**
- [x] Client components avoid direct DB calls and delegate to server actions.
- [x] Server actions handle redirects/errors so UX stays consistent (forms receive validation messages).

---

## 4) middleware (Optional) - Auth & Cookie Hardening
**Goal**
- Guard protected routes and refresh Supabase cookies during SSR.

**Implementation Summary (to do)**
- Gate `/recipes/new` for authenticated users.
- Ensure Supabase session cookies refresh when needed.

**Checklist**
- [ ] Middleware limited to necessary routes.
- [ ] No duplicated permission checks between middleware and server actions.


