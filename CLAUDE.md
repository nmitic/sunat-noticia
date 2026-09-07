# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SUNAT News Aggregation Platform** - A Next.js 16 full-stack application that aggregates news from official SUNAT sources (`sunat.gob.pe` and `gob.pe`), with admin approval workflow, real-time SSE updates, and public email subscriptions.

Only official sources are scraped. Facebook and third-party news outlets (La República, Gestión) were removed, along with the in-feed ads system.

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Node.js, Next.js API Routes
- **Database**: PostgreSQL + Drizzle ORM 0.45 (drizzle-kit 0.31 — keep these in step; an older drizzle-kit breaks `drizzle.config.ts`)
- **Authentication**: NextAuth.js 4 (Credentials provider)
- **Real-time**: Server-Sent Events (SSE)
- **Task Scheduling**: node-cron
- **Validation**: Zod
- **Utilities**: date-fns (Spanish locale), bcryptjs

## Development Commands

- **`npm run dev`** - Start development server (http://localhost:3000) with hot-reload
- **`npm run build`** - Create optimized production build
- **`npm run start`** - Start production server (requires `npm run build` first)
- **`npm run lint`** - Run ESLint code quality checks
Database scripts are environment-scoped — there is no bare `db:generate`/`db:migrate`. Use the `db:local:*` variants (loads `.env.local`) or `db:prod:*` (loads `.env`):

- **`npm run db:local:generate`** / **`db:prod:generate`** - Generate Drizzle migrations from schema
- **`npm run db:local:migrate`** / **`db:prod:migrate`** - Run Drizzle migrations
- **`npm run db:local:push`** / **`db:prod:push`** - Push Drizzle schema to database (the workflow this project actually uses)
- **`npm run db:local:seed`** / **`db:prod:seed`** - Seed admin user from environment variables
- **`npm run db:local:studio`** / **`db:prod:studio`** - Open Drizzle Studio GUI

## Complete Project Structure

```
sunat-noticias/
├── app/                              # Next.js App Router
│   ├── (public)/                     # Public routes group
│   │   ├── layout.tsx                # Public shell — NO header/footer (see below)
│   │   ├── page.tsx                  # Status page ("¿SUNAT está caído?")
│   │   ├── noticias/                 # News feed + per-article pages
│   │   └── embeded/                  # NOTE: one "d". This is the live spelling.
│   │       ├── layout.tsx            # Background only; width belongs to pages
│   │       ├── noticias/page.tsx     # /embeded/noticias — chrome-free feed
│   │       └── estado/page.tsx       # /embeded/estado — chrome-free status
│   ├── admin/                        # Admin routes (protected)
│   │   ├── layout.tsx                # Admin layout with nav/auth check
│   │   ├── login/
│   │   │   └── page.tsx              # Admin login form
│   │   └── noticias/
│   │       └── page.tsx              # News review queue
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── news/[id]/route.ts        # PATCH publish, DELETE reject
│   │   ├── subscriptions/route.ts    # POST email signup
│   │   ├── sse/route.ts              # GET SSE stream
│   │   └── scheduler/
│   │       ├── init/route.ts         # POST initialize scheduler
│   │       └── run/route.ts          # POST manual scraper trigger
│   ├── layout.tsx                    # Root layout
│   └── globals.css                   # Global styles
├── components/
│   ├── news/
│   │   ├── NewsFeed.tsx              # SSE-enabled public feed
│   │   └── NewsCard.tsx              # News item display (public)
│   ├── admin/
│   │   ├── ReviewQueue.tsx           # Admin review interface
│   │   ├── FlagSelector.tsx          # Flag checkboxes
│   │   └── NewsCard.tsx              # News item display (admin)
│   ├── auth/
│   │   └── SignOutButton.tsx         # Logout button
│   ├── layout/
│   │   ├── Header.tsx                # Public header
│   │   ├── Footer.tsx                # Public footer
│   │   └── EmailSignup.tsx           # Email subscription form
├── lib/
│   ├── auth/
│   │   └── config.ts                 # NextAuth configuration
│   ├── db/
│   │   ├── schema.ts                 # Drizzle schema definitions
│   │   └── drizzle.ts                # Drizzle client and connection pool
│   ├── scrapers/
│   │   ├── base.ts                        # BaseScraper abstract class
│   │   ├── oficial-sunat-mensajes.ts      # sunat.gob.pe/mensajes (ISO-8859-1)
│   │   ├── oficial-sunat-salapresa.ts     # sunat.gob.pe/salaprensa (sets SALA_PRENSA flag)
│   │   ├── oficial-sunat-institucion.ts   # gob.pe/institucion/sunat/noticias (two-stage)
│   │   └── scheduler.ts                   # cron-based scheduler
│   ├── sse/
│   │   └── broadcast.ts              # SSE broadcast utility
│   └── utils/
│       ├── constants.ts              # Spanish UI text constants
│       └── badges.ts                 # Badge/color utilities
├── prisma/                           # legacy dir name; Prisma is NOT used
│   └── seed.ts                       # Admin user seeding script (uses Drizzle)
├── drizzle/
│   └── *.sql                         # Generated Drizzle migrations
├── drizzle.config.ts                 # Drizzle Kit configuration
├── types/
│   └── (TypeScript types as needed)
├── .env.local                        # Environment configuration (secrets)
├── .gitignore
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
├── next.config.ts                    # Next.js configuration
├── eslint.config.mjs                 # ESLint configuration
├── CLAUDE.md                         # This file
├── SETUP.md                          # Setup and deployment guide
└── README.md                         # Project README
```

## Architecture Overview

### Data Flow
1. **Scrapers** → News stored in database as unpublished
2. **Admin** → Reviews unpublished news, assigns flags
3. **Admin Publishes** → SSE broadcasts to all connected clients
4. **Public Feed** → Displays published news with real-time updates
5. **Email Signup** → Subscriptions stored (delivery not implemented yet)

### Key Components

#### Scraper System
- **Base Pattern**: `lib/scrapers/base.ts` - Abstract class with error handling, logging, deduplication. Expose config via the public `settings` getter (do not reach for the `protected config`).
- **Official Scrapers**: three, all `OFICIAL` category, registered in `lib/scrapers/scheduler.ts` on a 6-hour cron — `oficial-sources-mensaje`, `oficial-sources-sala`, `oficial-sources-institucion`.
- **Deduplication**: `base.ts` keys on `title + source + originalDate`. Note `oficial-sunat-mensajes.ts` hardcodes the title `'COMUNICADO'`, so two comunicados on the same date collapse into one.
- **Execution**: ⚠️ `/api/scheduler/init` exists but **nothing calls it** — the `SchedulerInitializer` component was removed and is not in the root layout. In practice scrapers run only via the admin panel's manual trigger (`POST /api/scheduler/run`). Wire up the initializer if automatic scheduling is wanted.

#### Database Models
- **News**: Title, content, source, category, flags, published status, timestamps
- **EmailSubscription**: Email, active status for future delivery
- **Admin**: Email, password hash, name
- **ScraperRun**: Logs all scraper executions (success/failure, item count, errors)

#### Real-time Updates
- **SSE Endpoint**: `/api/sse` - Returns `ReadableStream` with persistent connection
- **Broadcast**: `lib/sse/broadcast.ts` - In-memory Set of active connections
- **Client**: `components/news/NewsFeed.tsx` - Listens to SSE, updates feed
- **Trigger**: Called when admin publishes news → broadcastNewNews(newsId)

#### Authentication
- **Provider**: Credentials (email/password only)
- **Session**: JWT strategy, 24-hour max age
- **Protected Routes**: All `/admin/*` routes
- **Login Page**: `/admin/login` with error messages

### UI Features

#### Admin
- Login with email/password
- Review unpublished news (title, content, source, category, date)
- Assign flags: Importante, Actualización, Urgente, Caída de Sistema
- Publish with flags or Reject news
- Color-coded badges in UI

#### Public
- Main feed showing all published news (newest first)
- Real-time updates via SSE (no page refresh)
- "Nuevo" badge on recently published items (auto-disappears after 1 hour)
- Category badge (Oficial — the only category)
- Flag badges with color coding
- Email signup form (persistence only, no delivery)

#### Embed Mode

Two chrome-free routes meant to be dropped into a third-party iframe. Both spell
it **`embeded`, with one "d"** — that is the deployed spelling, so renaming it
breaks every link already handed out. Do not "fix" it.

- **`/embeded/noticias`** — the news feed. Accepts `?category=` and `?flags=`.
  Keeps the feed's SSE updates. Bare `/embeded` 308s here (it was the feed's URL
  back when it was the only embed), so old links keep working.
- **`/embeded/estado`** — the status panel: `StatusHero` + `AffectedServices`
  only. No incident history, no schedule, no news strip — a host page gives this
  a fixed slot, so anything below the fold would never be seen. Static per load
  (no polling, no SSE) and `noindex`, since it would otherwise compete with `/`.

Both pass an `embeded` prop down so links open in a new tab (`NewsCard.tsx`,
`StatusHero.tsx`) — navigating in place would strand the reader inside a frame
they cannot get out of. Hrefs stay **relative**: the iframe's document is served
from this origin, so they resolve correctly whatever the host page is.

`StatusHero` does two more things in embed mode: it drops its `h1` to an `h2`, so
it does not inject a second top-level heading into the host's outline, and it
repoints its `#incidencias` anchor at `/#incidencias`, since the embed renders no
incident history for a bare fragment to find.

`app/(public)/embeded/layout.tsx` supplies only the background — width and
padding belong to each page, because the feed wants `max-w-4xl` and the status
panel `max-w-2xl`, and a nested route cannot escape a parent layout.

Framing is gated by the CSP `frame-ancestors` list in `next.config.ts`.

#### Public JSON API

- **`GET /api/public/news`** — the paginated feed.
- **`GET /api/public/status`** — the same status the estado embed renders, as
  JSON: `level`, `primary`, `active`, `upcoming`, `affectedServices`,
  `evaluatedAt`, `lastNewsAt`, `unreviewedCount` (`PublicStatusResponse` in
  `lib/api/status.ts`).

Both are CORS-gated to `ALLOWED_PUBLIC_ORIGINS` (`lib/api/cors.ts`); any other
`Origin` — including none at all — gets a 403. Note that list is duplicated with
the CSP `frame-ancestors` value in `next.config.ts`, so a new consumer origin
means editing both.

In the status payload every date is ISO 8601 and each notice `url` is
**absolute**, unlike the rendered embed — a JSON consumer holds a bare string
with no document to resolve a path against. `title` is the raw scraped title,
which can be a sentence fragment; render `structuredData` for the readable one.

### Spanish Localization
All UI text in Spanish (Spain variant):
- Category: Oficial
- Flags: Importante, Actualización, Urgente, Caída de Sistema
- Buttons: Publicar, Rechazar, Suscribirse, etc.
- date-fns using `es` locale for relative dates

## Database Setup

### Local Development
```bash
# Create PostgreSQL database
createdb sunat_noticias

# Add to .env.local
POSTGRES_URL="postgresql://localhost:5432/sunat_noticias"

# Run migrations
npm run db:local:push

# Seed admin user
npm run db:local:seed
```

### Cloud Services
- Vercel Postgres
- Supabase
- Railway
- PlanetScale

See [SETUP.md](./SETUP.md) for detailed instructions.

## Environment Variables Required

```
# Database — note the name is POSTGRES_URL, not DATABASE_URL
POSTGRES_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=<generate: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Admin User Seeding
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecurePassword123
```

## Common Development Tasks

### Run Development Server
```bash
npm run dev
# Visit http://localhost:3000
```

### Access Admin Panel
```
URL: http://localhost:3000/admin/login
Email: admin@example.com (from .env.local ADMIN_EMAIL)
Password: SecurePassword123 (from .env.local ADMIN_PASSWORD)
```

### Test Scraper
1. Login to admin panel
2. Trigger a scraper from the admin panel, or `POST /api/scheduler/run` with
   `{"scraperName": "oficial-sources-mensaje"}` (or `oficial-sources-sala` / `oficial-sources-institucion`)

### Publish News
1. Go to `/admin/noticias`
2. Review unpublished news items
3. Optionally assign flags
4. Click "Publicar"
5. News appears in real-time on `/` for all connected clients

### Test Real-time Updates
1. Open `/` in two browser windows
2. Admin panel in third window
3. Publish news → see instantly in both public windows

### Test Email Subscription
1. On `/`, scroll to footer
2. Enter email and click "Suscribirse"
3. Check database: `npm run db:local:studio` → EmailSubscription table

### View Database
```bash
npm run db:local:studio
# Browse all tables, edit data
```

## Key Files & Their Purposes

| File | Purpose |
|------|---------|
| `lib/api/status.ts` | Shared status load (`loadSiteStatus`) + JSON shape for the public API |
| `lib/api/status-query.ts` | Outage-candidate and freshness queries behind the status page |
| `lib/outage/status.ts` | Pure status computation — **must stay DB-free** so `npm test` runs with no env |
| `lib/db/schema.ts` | Drizzle schema definitions (tables, enums) |
| `lib/db/drizzle.ts` | Drizzle client and connection pool |
| `drizzle.config.ts` | Drizzle Kit configuration |
| `lib/auth/config.ts` | NextAuth configuration, admin authentication |
| `lib/scrapers/base.ts` | Abstract scraper class, common patterns |
| `lib/sse/broadcast.ts` | Real-time update broadcasting |
| `components/news/NewsFeed.tsx` | Public feed with SSE listener |
| `app/admin/noticias/page.tsx` | Admin review queue |
| `app/api/sse/route.ts` | SSE endpoint for real-time updates |
| `lib/utils/badges.ts` | Badge logic and color utilities |
| `lib/utils/constants.ts` | Spanish UI text |

## Best Practices

### Adding New Scrapers
1. Create `lib/scrapers/yoursite.ts` extending `BaseScraper`
2. Implement `scrape()` method
3. Add to scrapers array in `lib/scrapers/scheduler.ts`
4. Set `enabled: true` and configure cron schedule
5. Test manually via API before enabling automatic scheduling

### Styling
- Use Tailwind utility classes only (no custom CSS unless absolutely necessary)
- Maintain Spanish text consistently
- Test responsive design on mobile
- Use color classes: bg-red-100, text-blue-800, border-green-300, etc.

### Component Patterns
- Server components by default (faster, secure)
- Use 'use client' only when needed (forms, SSE, event listeners)
- Pass initial data from server, hydrate on client
- Avoid N+1 queries by using Prisma select

### Error Handling
- API routes return proper HTTP status codes (400, 401, 500)
- User-facing errors in Spanish
- Console logs for debugging
- Database errors caught and logged

## Testing Strategy

### Manual Testing Checklist
- [ ] Admin login/logout works
- [ ] Unpublished news displays in review queue
- [ ] Can assign flags and publish
- [ ] Published news appears on public feed
- [ ] SSE real-time update works (test in 2 windows)
- [ ] "Nuevo" badge appears and disappears
- [ ] Email subscription form works
- [ ] Embed mode hides header/footer (`/embeded/noticias` and `/embeded/estado`)
- [ ] Bare `/embeded` still redirects to `/embeded/noticias`
- [ ] Embed links open in a new tab instead of navigating inside the frame
- [ ] `/api/public/status` returns 200 for an allowed `Origin`, 403 otherwise
- [ ] All text is in Spanish

### Build Verification
```bash
npm run build
# Should complete successfully with all routes listed
```

## Deployment Considerations

- **Database**: Must be PostgreSQL in production
- **Environment**: Set all env vars in hosting platform
- **Cron**: Ensure scraper scheduler runs (consider external cron service)
- **SSE**: Verify hosting supports long-lived connections
- **CORS**: Configure for embedded mode if cross-domain
- **Monitoring**: Set up error tracking (Sentry recommended)

## Future Enhancements

1. **Email Delivery**: Implement sending news summaries to subscribers
2. **Additional Scrapers**: Oficial sources, news outlets
3. **Search**: Full-text search for news
4. **Filtering**: By category, flags, date range
5. **User Accounts**: Allow public login for saved preferences
6. **Notifications**: Browser push notifications
7. **Analytics**: Track popular news, user engagement
8. **CDN**: Cache public feed for better performance

## Related Documentation

- [SETUP.md](./SETUP.md) - Setup, installation, and deployment instructions
- [Technical Plan](./plan.md) - Full architecture and design decisions

## Support & Debugging

### Common Issues

**"Database connection error"**
- Check POSTGRES_URL is correct
- Ensure PostgreSQL is running
- Verify network connectivity

**"Admin login fails"**
- Verify ADMIN_EMAIL and ADMIN_PASSWORD in .env.local
- Check database was seeded: `npm run db:local:seed`
- Clear browser cookies

**"Scraper returns 0 items"**
- Check FACEBOOK_ACCESS_TOKEN is valid
- Verify token has `pages_read_engagement` permission
- Check SUNAT page still has public posts

**"SSE connection not working"**
- Verify `/api/sse` endpoint returns 200
- Check browser supports EventSource
- Verify no proxy/firewall blocking streaming

See [SETUP.md](./SETUP.md) Troubleshooting section for more help.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
