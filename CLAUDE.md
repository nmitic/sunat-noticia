# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SUNAT News Aggregation Platform** - A Next.js 16 full-stack application that aggregates news from multiple sources (official SUNAT websites, Facebook, news outlets), with admin approval workflow, real-time SSE updates, and public email subscriptions.

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Node.js, Next.js API Routes
- **Database**: PostgreSQL + Drizzle ORM 0.44
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
- **`npm run db:generate`** - Generate Drizzle migrations from schema
- **`npm run db:migrate`** - Run Drizzle migrations
- **`npm run db:push`** - Push Drizzle schema to database
- **`npm run db:seed`** - Seed admin user from environment variables
- **`npm run db:studio`** - Open Drizzle Studio GUI (http://localhost:5555)

## Complete Project Structure

```
sunat-noticias/
├── app/                              # Next.js App Router
│   ├── (public)/                     # Public routes group
│   │   ├── layout.tsx                # Public layout (header, footer)
│   │   ├── page.tsx                  # Main news feed
│   │   └── embedded/
│   │       ├── layout.tsx            # Embedded layout (no header/footer)
│   │       └── page.tsx              # Embedded news feed
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
│   ├── layout.tsx                    # Root layout with SchedulerInitializer
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
│   └── SchedulerInitializer.tsx      # Initializes scraper scheduler on app load
├── lib/
│   ├── auth/
│   │   └── config.ts                 # NextAuth configuration
│   ├── db/
│   │   ├── schema.ts                 # Drizzle schema definitions
│   │   └── drizzle.ts                # Drizzle client and connection pool
│   ├── scrapers/
│   │   ├── base.ts                   # BaseScraper abstract class
│   │   ├── facebook.ts               # Facebook Graph API scraper (active)
│   │   ├── oficial-placeholder.ts    # Placeholder for official sources
│   │   ├── noticias-placeholder.ts   # Placeholder for news outlets
│   │   └── scheduler.ts              # cron-based scheduler
│   ├── sse/
│   │   └── broadcast.ts              # SSE broadcast utility
│   └── utils/
│       ├── constants.ts              # Spanish UI text constants
│       └── badges.ts                 # Badge/color utilities
├── prisma/
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
├── tailwind.config.ts                # Tailwind configuration
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
- **Base Pattern**: `lib/scrapers/base.ts` - Abstract class with error handling, logging, deduplication
- **Facebook Scraper**: `lib/scrapers/facebook.ts` - Fetches SUNAT posts via Meta Graph API
- **Placeholders**: Prepared interfaces for future scrapers (oficial, noticias outlets)
- **Scheduler**: `lib/scrapers/scheduler.ts` - Uses node-cron for automatic execution
- **Execution**: Triggered on app boot via `SchedulerInitializer` → `/api/scheduler/init`

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
- Category badges (Oficial, Redes Sociales, Noticias)
- Flag badges with color coding
- Email signup form (persistence only, no delivery)

#### Embedded Mode
- `/embedded` route shows feed without header/footer
- Same real-time updates as public feed
- Can be embedded in iframe

### Spanish Localization
All UI text in Spanish (Spain variant):
- Categories: Oficial, Redes Sociales, Noticias
- Flags: Importante, Actualización, Urgente, Caída de Sistema
- Buttons: Publicar, Rechazar, Suscribirse, etc.
- date-fns using `es` locale for relative dates

## Database Setup

### Local Development
```bash
# Create PostgreSQL database
createdb sunat_noticias

# Add to .env.local
DATABASE_URL="postgresql://localhost:5432/sunat_noticias"

# Run migrations
npm run db:push

# Seed admin user
npm run db:seed
```

### Cloud Services
- Vercel Postgres
- Supabase
- Railway
- PlanetScale

See [SETUP.md](./SETUP.md) for detailed instructions.

## Environment Variables Required

```
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=<generate: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Facebook API
FACEBOOK_ACCESS_TOKEN=<get from Facebook Developer Console>

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
2. Add unpublished news via Facebook scraper automatically (every 2 hours)
3. Or manually trigger: `POST /api/scheduler/run` with `{"scraperName": "facebook-sunat"}`

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
3. Check database: `prisma studio` → EmailSubscription table

### View Database
```bash
npx prisma studio
# Opens http://localhost:5555
# Browse all tables, edit data
```

## Key Files & Their Purposes

| File | Purpose |
|------|---------|
| `lib/db/schema.ts` | Drizzle schema definitions (tables, enums) |
| `lib/db/drizzle.ts` | Drizzle client and connection pool |
| `drizzle.config.ts` | Drizzle Kit configuration |
| `lib/auth/config.ts` | NextAuth configuration, admin authentication |
| `lib/scrapers/base.ts` | Abstract scraper class, common patterns |
| `lib/scrapers/facebook.ts` | Facebook data collection logic |
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
- [ ] Embedded mode hides header/footer
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
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Verify network connectivity

**"Admin login fails"**
- Verify ADMIN_EMAIL and ADMIN_PASSWORD in .env.local
- Check database was seeded: `npm run db:seed`
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
