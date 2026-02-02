# Deployment Guide

## Prerequisites

1. **Vercel Account** - Connected to GitHub
2. **Supabase Project** - Database with tables created
3. **Environment Variables** - All required keys configured

---

## Step 1: Database Setup

### Run SQL Scripts

```bash
# Connect to your Supabase database
psql $POSTGRES_URL

# Run migration scripts in order
\i scripts/002-create-cu-config-tables.sql
\i scripts/003-create-state-teachers-tables.sql
\i scripts/004-create-cu-products-schema.sql
\i scripts/005-add-demo-cu-and-marketing-role.sql
```

Or use the Supabase SQL Editor to run each script.

### Verify Tables

Check that these tables exist:
- `cu_configs`
- `cu_directory`
- `ncua_credit_unions`
- `state_teachers`
- `state_background_photos`
- `cu_products`
- `cu_marketing_content`

---

## Step 2: Environment Variables

### In Vercel Dashboard

1. Go to **Project Settings** → **Environment Variables**
2. Add all variables from `.env.example`
3. Key variables:
   - `SUPABASE_URL` (from Supabase integration)
   - `SUPABASE_ANON_KEY` (from Supabase integration)
   - `UNSPLASH_ACCESS_KEY` = `Baj-jRwWOwr3bNFYdKBVQ2lCQJCIYOxZq2OOK0uV8b4`
   - `NEXT_PUBLIC_ADMIN_EMAIL` = `compliance@cu.app`

---

## Step 3: Deploy to Vercel

### Option A: GitHub Auto-Deploy (Recommended)

```bash
# Push to GitHub
git add .
git commit -m "feat: CU.APP configuration matrix v2.0"
git push origin main
```

Vercel will auto-deploy from GitHub.

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## Step 4: Seed Data

### Seed Credit Unions (4300+ from NCUA)

```bash
# Trigger the cron job manually
curl -X POST https://your-app.vercel.app/api/cron/seed-credit-unions
```

This will batch process all NCUA credit unions into `cu_configs`.

### Fetch State Background Photos

```bash
# Trigger Unsplash photo fetching
curl -X POST https://your-app.vercel.app/api/cron/unsplash-state-photos
```

This will fetch environment photos for all 50 states.

---

## Step 5: Verify Deployment

1. **Admin Dashboard**: `https://your-app.vercel.app`
2. **Marketing CMS**: `https://your-app.vercel.app/marketing`
3. **Preview Site**: `https://your-app.vercel.app/preview/5536` (Navy Federal example)
4. **API Health**: `https://your-app.vercel.app/api/health`

---

## Cron Jobs

These run automatically on Vercel:

| Job | Schedule | Purpose |
|-----|----------|---------|
| `config-sync` | Hourly | Validate and sync configs |
| `config-backup` | Daily (midnight) | Backup all configs |
| `sync-cu-data` | Daily (6 AM) | Pull NCUA updates |
| `motion-sync` | Every 30 min | Sync Motion design tokens |
| `core-discovery` | Every 12 hours | Discover core banking APIs |
| `seed-credit-unions` | Weekly (Sunday 2 AM) | Re-seed credit unions |
| `unsplash-state-photos` | Monthly (1st day, 3 AM) | Refresh state photos |

---

## Monitoring

### Vercel Dashboard
- **Deployments**: Track build status
- **Logs**: View runtime logs
- **Analytics**: Monitor traffic

### Supabase Dashboard
- **Database**: Check row counts
- **Auth**: Monitor user sessions
- **Storage**: Verify file uploads

---

## Troubleshooting

### Build Fails
```bash
# Check TypeScript errors
npm run lint

# Rebuild locally
npm run build
```

### Database Connection Issues
```bash
# Test Supabase connection
curl https://your-project.supabase.co/rest/v1/

# Check environment variables in Vercel
```

### Cron Jobs Not Running
- Verify `vercel.json` is in root directory
- Check cron job logs in Vercel dashboard
- Ensure paths match API routes exactly

---

## Rollback

If deployment has issues:

```bash
# In Vercel Dashboard
1. Go to Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
```

---

## Support

- **Platform Issues**: GitHub Issues
- **Database Help**: Check Supabase logs
- **Deployment Help**: Vercel support
