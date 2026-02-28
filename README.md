# KOMPLEET Platform (Web)

**KOMPLEET** is a comprehensive financial management platform for Nigerian businesses and individuals, built to comply with the Nigerian Tax Act 2026.

## Overview

The KOMPLEET Web Platform provides:

- **User Authentication** - Supabase authentication with Google OAuth, email/password, and magic links
- **Transaction Management** - Income and expense tracking with categorization
- **Tax Calculators** - Business Tax (CIT), Individual Tax (PIT), VAT, Capital Allowances, Stamp Duty, Property Tax
- **Financial Reports** - Tax summaries, balance sheets, profit & loss statements with PDF export
- **Compliance Dashboard** - Real-time compliance health monitoring
- **Tax Deadline Reminders** - Push notifications for important tax deadlines

## Tech Stack

### Frontend

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.9
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Charts:** Recharts

### Backend & Services

- **Authentication:** Supabase Auth
- **Database:** Supabase PostgreSQL with Row Level Security (RLS)
- **Deployment:** Vercel
- **Package Manager:** pnpm

### Key Integrations

- **Supabase:** User authentication and management
- **Supabase:** Database, RLS policies, and data storage
- **Vercel:** Hosting and serverless functions
- **Webhooks:** Clerk user sync to Supabase

## Project Structure

```
kompleet-platform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   │   ├── login/         # Login page with Clerk SignIn
│   │   │   └── signup/        # Signup page with Clerk SignUp
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── transactions/  # Transaction management
│   │   │   ├── calculators/   # Tax calculators
│   │   │   ├── reports/       # Financial reports
│   │   │   └── profile/       # User profile & settings
│   │   ├── api/               # API routes
│   │   │   └── webhooks/
│   │   │       └── clerk/     # Clerk webhook handler
│   │   └── middleware.ts      # Clerk auth middleware
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   └── ...               # Custom components
│   ├── lib/                  # Utilities and helpers
│   │   └── supabase/
│   │       ├── server.ts     # Supabase server client (Clerk JWT)
│   │       └── client.ts     # Supabase browser client
│   └── supabase/
│       └── migrations/       # Database migrations
│           └── CLERK_SYNC_MIGRATION.sql
├── public/                   # Static assets
├── .env.local               # Environment variables (not committed)
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Setup

### Prerequisites

- Node.js 18+ and pnpm
- Clerk account (https://clerk.com)
- Supabase project (https://supabase.com)
- Vercel account for deployment (https://vercel.com)

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Ivano-Technologies/KOMPLEET-PLATFORM.git
   cd KOMPLEET-PLATFORM
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Configure Clerk:**
   - Create a Clerk application at https://dashboard.clerk.com
   - Enable Email/Password and Google OAuth providers
   - Create JWT template named `kompleet-supabase` with custom claims:
     ```json
     {
       "sub": "{{user.id}}"
     }
     ```
   - Copy publishable key and secret key to `.env.local`

4. **Configure Supabase:**
   - Create a Supabase project at https://supabase.com/dashboard
   - Go to Settings → API → JWT Settings
   - Add Clerk as JWT provider:
     - JWKS URL: `https://your-clerk-domain/.well-known/jwks.json`
     - JWT Secret: (from Clerk JWT template)
   - Run database migration:
     ```bash
     psql -h your-project.supabase.co -U postgres -d postgres -f src/supabase/migrations/CLERK_SYNC_MIGRATION.sql
     ```

5. **Configure Clerk Webhook:**
   - In Clerk Dashboard, go to Webhooks
   - Create endpoint: `https://your-domain.com/api/webhooks/clerk`
   - Subscribe to events: `user.created`, `user.updated`, `user.deleted`
   - Copy webhook secret to `.env.local`

6. **Run development server:**

   ```bash
   pnpm dev
   ```

7. **Open browser:**
   ```
   http://localhost:3000
   ```

## Database Schema

The platform uses Supabase PostgreSQL with the following key tables:

### `clerk_users`

Synced from Clerk via webhook, stores user profile data:

- `clerk_user_id` (primary key) - Clerk user ID
- `email` - User email address
- `first_name`, `last_name` - User name
- `avatar_url` - Profile picture URL
- `created_at`, `updated_at` - Timestamps

### `transactions`

Financial transactions (income/expenses):

- `id` (UUID primary key)
- `user_id` (references `clerk_users.clerk_user_id`)
- `type` - 'income' or 'expense'
- `category` - Transaction category
- `amount` - Transaction amount
- `description` - Transaction description
- `date` - Transaction date
- RLS policies ensure users can only access their own transactions

### Row Level Security (RLS)

All tables have RLS policies that:

1. Extract Clerk user ID from JWT using `get_clerk_user_id()` helper function
2. Restrict access to user's own data only
3. Support both Clerk JWT and Supabase Auth during migration

## Authentication Flow

### User Sign-Up/Sign-In

1. User signs up/in via Clerk UI components (`<SignIn />`, `<SignUp />`)
2. Clerk creates user account and issues JWT
3. Clerk webhook fires `user.created` event
4. Webhook handler (`/api/webhooks/clerk`) syncs user to `clerk_users` table
5. User is redirected to dashboard

### API Authentication

1. Clerk middleware (`middleware.ts`) protects routes
2. Supabase client (`lib/supabase/server.ts`) extracts Clerk JWT
3. Supabase validates JWT using Clerk JWKS
4. RLS policies use `get_clerk_user_id()` to enforce access control

## API Routes

### `/api/webhooks/clerk` (POST)

Webhook endpoint for Clerk user sync:

- **Events:** `user.created`, `user.updated`, `user.deleted`
- **Authentication:** Clerk webhook signature verification
- **Actions:** Upsert/delete user in `clerk_users` table

## Deployment

### Vercel Deployment

1. **Connect repository to Vercel:**

   ```bash
   vercel
   ```

2. **Configure environment variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`
   - Ensure variables are set for Production, Preview, and Development

3. **Deploy:**

   ```bash
   vercel --prod
   ```

4. **Configure Clerk webhook URL:**
   - Update webhook endpoint to production URL: `https://your-domain.com/api/webhooks/clerk`

### Important Notes

- Clerk environment variables (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) MUST be set in Vercel for production
- Webhook secret must match between Clerk Dashboard and Vercel environment variables
- Supabase JWT configuration must include Clerk JWKS URL

## Testing

### Test User Creation

1. Sign up at `/signup`
2. Check Supabase `clerk_users` table for synced user
3. Verify RLS policies by querying transactions

### Test Webhook

```bash
curl -X POST https://your-domain.com/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -H "svix-id: test" \
  -H "svix-timestamp: $(date +%s)" \
  -H "svix-signature: test" \
  -d '{"type":"user.created","data":{"id":"user_test","email_addresses":[{"email_address":"test@example.com"}]}}'
```

## Migration from Supabase Auth

The platform has been migrated from Supabase Auth to Clerk. Key changes:

- ✅ Clerk authentication UI components replace Supabase Auth UI
- ✅ Clerk JWT replaces Supabase JWT
- ✅ `clerk_users` table replaces `auth.users` references
- ✅ RLS policies updated to use `get_clerk_user_id()` helper
- ✅ Webhook integration for user sync
- ✅ Dual-auth support during migration (both Clerk and Supabase Auth work)

## Related Repositories

- **Mobile App:** [KOMPLEET-MOBILE](https://github.com/Ivano-Technologies/KOMPLEET-MOBILE)
- **Program Management:** [kompleet-program-management](https://github.com/Ivano-Technologies/kompleet-program-management)

## Documentation

- **Clerk Documentation:** https://clerk.com/docs
- **Supabase Documentation:** https://supabase.com/docs
- **Next.js Documentation:** https://nextjs.org/docs
- **Nigerian Tax Act 2026:** https://firs.gov.ng

## Support

For issues or questions:

- **GitHub Issues:** https://github.com/Ivano-Technologies/KOMPLEET-PLATFORM/issues
- **Email:** support@techivano.com

## License

Proprietary - Ivano Technologies Ltd © 2026
