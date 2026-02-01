# SUNAT Noticias - Setup Guide

This guide will help you set up and run the SUNAT News Aggregation Platform locally.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+ (or access to a PostgreSQL database service)
- Facebook App with access token (for scraping SUNAT Facebook page)

## Step 1: Database Setup

### Option A: Local PostgreSQL

```bash
# Create a new PostgreSQL database
createdb sunat_noticias

# Get your connection URL
# postgresql://localhost:5432/sunat_noticias
# Or with credentials: postgresql://username:password@localhost:5432/sunat_noticias
```

### Option B: Cloud PostgreSQL Services

- **Vercel Postgres**: https://vercel.com/docs/storage/vercel-postgres
- **Supabase**: https://supabase.com/docs/guides/database
- **Railway**: https://railway.app/
- **PlanetScale**: https://planetscale.com/

## Step 2: Environment Configuration

1. Update `.env.local` with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sunat_noticias"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Facebook API
FACEBOOK_ACCESS_TOKEN="your-facebook-app-access-token"

# Admin User (for seed script)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="SecurePassword123"
```

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### Get Facebook Access Token

1. Go to https://developers.facebook.com/
2. Create a new app (Business type)
3. Add "Facebook Login" product
4. Generate User Access Token with `pages_read_engagement` permission
5. Test the token using Graph API Explorer: `GET /SUNAT/posts`

## Step 3: Database Setup

```bash
# Run Prisma migrations
npx prisma migrate dev --name init

# Seed the admin user
npm run db:seed
```

## Step 4: Install and Run

```bash
# Install dependencies (if not already done)
npm install

# Run development server
npm run dev
```

The app will be available at http://localhost:3000

## Access Points

### Public Pages
- **Home**: http://localhost:3000/
- **Embedded**: http://localhost:3000/embedded

### Admin Panel
- **Login**: http://localhost:3000/admin/login
- **Review Queue**: http://localhost:3000/admin/noticias

**Admin Credentials**:
- Email: `admin@example.com` (or your configured ADMIN_EMAIL)
- Password: `SecurePassword123` (or your configured ADMIN_PASSWORD)

## API Endpoints

### Public APIs
- `GET /api/news` - Get published news (paginated)
- `GET /api/sse` - Server-Sent Events stream for real-time updates
- `POST /api/subscriptions` - Subscribe to email notifications

### Admin APIs (Requires Authentication)
- `PATCH /api/news/[id]` - Publish/update news and assign flags
- `DELETE /api/news/[id]` - Reject/delete news
- `POST /api/scheduler/run` - Manually run a specific scraper

### Scheduler APIs
- `POST /api/scheduler/init` - Initialize the scraper scheduler

## Testing the Scraper

### Manual Trigger

```bash
curl -X POST http://localhost:3000/api/scheduler/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"scraperName": "facebook-sunat"}'
```

### Check Scraper Runs

```bash
# In Prisma Studio (optional)
npx prisma studio
```

## Database Management

### Prisma Studio (GUI)

```bash
npx prisma studio
```

Opens a GUI at http://localhost:5555 to manage your database.

### Reset Database (⚠️ Deletes All Data)

```bash
npx prisma migrate reset
```

### Create a New Migration

```bash
npx prisma migrate dev --name your_migration_name
```

## Deployment

### Vercel (Recommended for Next.js)

1. Push code to GitHub
2. Go to https://vercel.com/new
3. Select your repository
4. Configure environment variables
5. Deploy

```bash
# Vercel will automatically run migrations with:
npx prisma migrate deploy
npx prisma db seed
```

### Other Platforms

#### Railway
1. Connect GitHub repo
2. Add PostgreSQL plugin
3. Set environment variables
4. Deploy

#### PlanetScale + Vercel
1. Create PlanetScale database
2. Get connection string
3. Deploy to Vercel with connection string

#### Self-Hosted
See your hosting provider's Node.js deployment guide.

## Troubleshooting

### "Database connection error"
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Verify network connectivity

### "Prisma client not generated"
```bash
npx prisma generate
```

### "NEXTAUTH_SECRET not configured"
- Generate and add to .env.local
- Restart dev server

### "Facebook API returns 401"
- Check FACEBOOK_ACCESS_TOKEN is valid
- Verify token has `pages_read_engagement` permission
- Generate a new token if expired

### "Admin login not working"
- Verify ADMIN_EMAIL and ADMIN_PASSWORD match what you set
- Check NextAuth session configuration
- Clear browser cookies and try again

### Port 3000 already in use
```bash
npm run dev -- -p 3001
```

## Next Steps

1. **Test the full workflow**:
   - Admin login → Review unpublished news → Publish with flags
   - Check public page for new news
   - Verify SSE real-time updates work
   - Test email subscription form

2. **Configure scrapers**:
   - Implement oficial and noticias scrapers
   - Add more data sources
   - Test scraper scheduling

3. **Customization**:
   - Update branding and colors in components
   - Modify email templates (when email delivery is implemented)
   - Add new categories or flags

4. **Production**:
   - Set up error tracking (Sentry)
   - Configure monitoring
   - Set up automated backups
   - Enable SSL/TLS
   - Configure CORS for embedded mode

## Support

For issues or questions:
1. Check the [CLAUDE.md](./CLAUDE.md) for development information
2. Review the [technical plan](./SETUP.md) for architecture details
3. Check Prisma documentation: https://www.prisma.io/docs/
4. Check NextAuth documentation: https://next-auth.js.org/

## Project Structure

```
sunat-noticias/
├── app/                          # Next.js App Router
├── components/                   # React components
├── lib/                         # Utilities and core logic
│   ├── auth/                   # Authentication
│   ├── db/                     # Database
│   ├── scrapers/               # News scrapers
│   ├── sse/                    # Real-time updates
│   └── utils/                  # Utilities
├── prisma/                     # Database schema
├── .env.local                  # Local environment variables
├── CLAUDE.md                   # Development guide
└── SETUP.md                    # This file
```

---

**Last Updated**: 2026-01-31
**Version**: 1.0.0
