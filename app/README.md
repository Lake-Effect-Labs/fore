# Fore - Golf Game Management Platform

A Next.js application for managing golf games, friends, organizations, and tournaments.

## Prerequisites

Before you begin, ensure you have:
- Node.js 20+ installed
- npm, yarn, pnpm, or bun package manager
- A Supabase account and project
- A Stripe account (for payment features)

## Setup Instructions

### 1. Install Dependencies

```bash
cd app
npm install
# or
yarn install
# or
pnpm install
```

### 2. Set Up Supabase

1. Create a new project at [Supabase](https://app.supabase.com)
2. Go to Project Settings → API
3. Copy your Project URL and anon/public key

### 3. Run Database Migrations

In your Supabase project:
1. Go to SQL Editor
2. Run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_b2b_schema.sql`

Alternatively, if you have Supabase CLI installed:
```bash
supabase db push
```

### 4. Set Up Stripe (Optional for basic testing)

1. Create a Stripe account at [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your test API keys from Developers → API keys
3. For webhooks, create a webhook endpoint pointing to your local server (use Stripe CLI for local testing)

### 5. Configure Environment Variables

Create a `.env.local` file in the `app` directory with the following:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration (Required for payment features)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (Optional - defaults provided in code)
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_premium_monthly
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_premium_yearly
```

**Note:** For local Stripe webhook testing, use the Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
This will give you a webhook secret to use in your `.env.local`.

### 6. Start Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Status

⚠️ **Not Ready for Dev Testing Yet**

The project requires:
- ✅ Dependencies installed (check if `node_modules` exists)
- ❌ Environment variables configured (`.env.local` file)
- ❌ Supabase database migrations run
- ⚠️ Stripe configuration (optional for basic features)

## Features

- **Authentication**: Supabase Auth integration
- **Games**: Skins, Nassau, and Match Play game formats
- **Friends**: Friend management and invitations
- **Organizations**: B2B features for golf courses and clubs
- **Events & Leagues**: Tournament and league management
- **Payments**: Stripe integration for premium subscriptions

## Project Structure

- `src/app/` - Next.js App Router pages
- `src/components/` - React components
- `src/lib/` - Utilities, actions, and business logic
- `src/types/` - TypeScript type definitions
- `supabase/migrations/` - Database schema migrations

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
