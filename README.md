# Scholaport Web MVP

Scholaport is a student-owned Academic Passport for international high-school transfer students. The existing interface is backed by Supabase Auth, PostgreSQL, Row Level Security, and private transcript storage.

## Local setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Set these required browser-safe variables in `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Scholaport intentionally shows a configuration screen when either value is missing. It does not fall back to a demo student.

## Database setup

Apply all migrations, in filename order, to the target Supabase project:

1. `supabase/migrations/202606190001_scholaport_mvp.sql`
2. `supabase/migrations/202606190002_authenticated_foundation.sql`
3. `supabase/migrations/202606200001_global_reference_foundation.sql`

The third migration adds the global country, jurisdiction, curriculum, course, destination-framework, requirement, program, mapping-rule, and provenance model. All 20 priority countries are seeded as `country_seed_only`; it does not invent curriculum or graduation facts.

## Reference-data research and import

- Google Sheets-compatible templates: `supabase/seed_templates/`
- Import-ready seed files: `supabase/seeds/`
- Importer: `scripts/import-reference-data.ts`
- Internal coverage view: `/reference-coverage` in development

Validate local seed files without writing to Supabase:

```bash
pnpm seed:reference:check
```

For an admin import, set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in an ignored `.env.seed.local`, then run `pnpm seed:reference`. The service-role key must never be exposed through a `VITE_` variable.

MVP 1 onboarding exposes exactly India, China, Mexico, the Philippines, and Pakistan as source countries, and the United States, Germany, Saudi Arabia, the United Kingdom, and the United Arab Emirates as destination countries. Canada, Australia, and the other priority-country shells remain stored for later releases but are hidden by the centralized allowlist in `src/lib/mvp-reference-scope.ts`.

## Real flows now implemented

- Supabase email/password registration, login, password reset, session restoration, and sign out
- Route protection and profile-aware onboarding redirects
- Student profile creation and editing
- Authenticated dashboard/passport reads
- Transcript file upload plus metadata persistence
- Persisted gap, roadmap, PathMatch, guide, Twin Connect, and advisor data access
- Roadmap item completion persistence
- Twin question submission and pending-moderation history
- Advisor conversation sessions and messages

OCR, automated credit mapping, automated gap/roadmap generation, full RAG, moderated mentor responses, and generated PDF files remain intentionally unimplemented.

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```
