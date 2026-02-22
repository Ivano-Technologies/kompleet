# Prisma ORM Integration

**Last Updated**: February 19, 2026  
**Status**: ✅ Implemented

---

## Overview

The KOMPLEET platform uses **Prisma ORM** alongside Supabase for complex server-side database operations. This dual-ORM approach provides:

- **Supabase Client**: For client-side queries, RLS-protected operations, and real-time subscriptions
- **Prisma**: For complex server-side queries, transactions, and type-safe database operations

---

## When to Use Prisma vs Supabase

### Use Prisma When:

✅ **Complex Server-Side Queries**

- Multi-table joins with complex conditions
- Aggregations and grouping operations
- Batch operations on large datasets

✅ **Database Transactions**

- Multiple operations that must succeed or fail together
- Atomic updates across multiple tables
- Financial calculations requiring ACID guarantees

✅ **Type-Safe Server Operations**

- API routes that need compile-time type checking
- Background jobs and cron tasks
- Data migrations and seeding

✅ **Performance-Critical Operations**

- Bulk inserts/updates (>100 records)
- Complex analytical queries
- Report generation

### Use Supabase Client When:

✅ **Client-Side Operations**

- User-facing queries in React components
- Real-time subscriptions
- File uploads to Supabase Storage

✅ **RLS-Protected Operations**

- User-specific data access
- Multi-tenant data isolation
- Permission-based queries

✅ **Simple CRUD Operations**

- Single-table queries
- Basic filtering and sorting
- User profile updates

---

## Setup

### 1. Installation

Prisma is already installed:

```bash
pnpm add -D prisma
pnpm add @prisma/client
```

### 2. Schema Location

```
prisma/
  schema.prisma    # Prisma schema file
```

### 3. Database Connection

Prisma uses the `DATABASE_URL` environment variable (same as Supabase):

```env
# .env or .env.local
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres"
```

**Important**: Use the **direct database connection** URL, not the pooled connection URL.

---

## Prisma Schema

The Prisma schema is automatically generated from your Supabase database:

```bash
# Pull schema from Supabase
npx prisma db pull

# Generate Prisma Client
npx prisma generate
```

### Example Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model transactions {
  id                     String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id                String    @db.Uuid
  source_file_id         String    @db.Uuid
  date                   DateTime  @db.Date
  description            String
  amount                 Decimal   @db.Decimal(15, 2)
  type                   String    @db.VarChar(10)
  currency               String?   @default("NGN") @db.VarChar(3)
  balance                Decimal?  @db.Decimal(15, 2)
  reference              String?
  bank_name              String?
  category               String?
  confidence_score       Decimal?  @db.Decimal(3, 2)
  categorization_method  String?   @db.VarChar(10)
  requires_review        Boolean?  @default(false)
  raw_category           String?
  raw_data               Json?
  created_at             DateTime  @default(now()) @db.Timestamptz(6)
  updated_at             DateTime  @default(now()) @db.Timestamptz(6)

  @@index([user_id])
  @@index([date])
  @@index([category])
}
```

---

## Usage

### 1. Initialize Prisma Client

Create a singleton Prisma client instance:

```typescript
// src/lib/prisma.ts

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### 2. Basic Queries

```typescript
import { prisma } from "@/lib/prisma";

// Find all transactions for a user
const transactions = await prisma.transactions.findMany({
  where: {
    user_id: userId,
    date: {
      gte: startDate,
      lte: endDate,
    },
  },
  orderBy: {
    date: "desc",
  },
});

// Create a transaction
const transaction = await prisma.transactions.create({
  data: {
    user_id: userId,
    source_file_id: fileId,
    date: new Date("2026-01-15"),
    description: "Salary Payment",
    amount: 450000,
    type: "credit",
    currency: "NGN",
  },
});

// Update a transaction
const updated = await prisma.transactions.update({
  where: { id: transactionId },
  data: {
    category: "Income",
    confidence_score: 0.95,
    categorization_method: "LLM",
  },
});
```

### 3. Complex Queries

```typescript
// Aggregate spending by category
const categorySpending = await prisma.transactions.groupBy({
  by: ["category"],
  where: {
    user_id: userId,
    type: "debit",
    date: {
      gte: startDate,
      lte: endDate,
    },
  },
  _sum: {
    amount: true,
  },
  _count: {
    id: true,
  },
  orderBy: {
    _sum: {
      amount: "desc",
    },
  },
});

// Monthly spending trend
const monthlySpending = await prisma.$queryRaw`
  SELECT 
    DATE_TRUNC('month', date) as month,
    SUM(amount) as total_spending,
    COUNT(*) as transaction_count
  FROM transactions
  WHERE user_id = ${userId}
    AND type = 'debit'
    AND date >= ${startDate}
    AND date <= ${endDate}
  GROUP BY DATE_TRUNC('month', date)
  ORDER BY month DESC
`;
```

### 4. Transactions

```typescript
// Atomic transaction across multiple operations
const result = await prisma.$transaction(async (tx) => {
  // Create transaction
  const transaction = await tx.transactions.create({
    data: transactionData,
  });

  // Update user balance
  await tx.user_profiles.update({
    where: { user_id: userId },
    data: {
      current_balance: {
        increment: transaction.amount,
      },
    },
  });

  // Log activity
  await tx.activity_logs.create({
    data: {
      user_id: userId,
      action: "transaction_created",
      transaction_id: transaction.id,
    },
  });

  return transaction;
});
```

---

## Best Practices

### 1. Use Prisma for Server-Side Only

❌ **Don't** use Prisma in client components:

```typescript
// ❌ Bad: Client component
"use client";
import { prisma } from "@/lib/prisma"; // This will fail!
```

✅ **Do** use Prisma in API routes and server components:

```typescript
// ✅ Good: API route
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const transactions = await prisma.transactions.findMany();
  return Response.json(transactions);
}
```

### 2. Always Use Transactions for Multi-Step Operations

```typescript
// ✅ Good: Atomic transaction
await prisma.$transaction([
  prisma.transactions.create({ data: tx1 }),
  prisma.transactions.create({ data: tx2 }),
  prisma.user_profiles.update({ where: { id }, data: { balance } }),
]);

// ❌ Bad: Non-atomic operations
await prisma.transactions.create({ data: tx1 });
await prisma.transactions.create({ data: tx2 });
await prisma.user_profiles.update({ where: { id }, data: { balance } });
```

### 3. Use Indexes for Performance

```prisma
model transactions {
  // ... fields ...

  @@index([user_id])        // For user-specific queries
  @@index([date])           // For date range queries
  @@index([category])       // For category filtering
  @@index([user_id, date])  // For combined queries
}
```

### 4. Handle Errors Gracefully

```typescript
try {
  const transaction = await prisma.transactions.create({ data });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      // Unique constraint violation
      throw new Error("Transaction already exists");
    }
  }
  throw error;
}
```

---

## Prisma vs Supabase Comparison

| Feature             | Prisma                   | Supabase Client                 |
| ------------------- | ------------------------ | ------------------------------- |
| **Type Safety**     | ✅ Full compile-time     | ✅ Runtime with generated types |
| **Performance**     | ✅ Direct DB connection  | ⚠️ HTTP overhead                |
| **RLS Support**     | ❌ Manual implementation | ✅ Automatic                    |
| **Real-time**       | ❌ Not supported         | ✅ Built-in subscriptions       |
| **Transactions**    | ✅ Full ACID support     | ⚠️ Limited                      |
| **Complex Queries** | ✅ Excellent             | ⚠️ Limited                      |
| **Client-Side**     | ❌ Server-only           | ✅ Works everywhere             |
| **File Storage**    | ❌ Not supported         | ✅ Built-in                     |

---

## Scripts

| Script              | Command               | Description                           |
| ------------------- | --------------------- | ------------------------------------- |
| **Pull Schema**     | `npx prisma db pull`  | Introspect Supabase and update schema |
| **Generate Client** | `npx prisma generate` | Generate Prisma Client from schema    |
| **Studio**          | `npx prisma studio`   | Open Prisma Studio (database GUI)     |
| **Format Schema**   | `npx prisma format`   | Format prisma/schema.prisma           |
| **Validate Schema** | `npx prisma validate` | Validate schema syntax                |

---

## Troubleshooting

### Prisma Client Not Found

**Problem**: `Cannot find module '@prisma/client'`

**Solution**:

```bash
npx prisma generate
```

### Schema Out of Sync

**Problem**: Prisma schema doesn't match database

**Solution**:

```bash
npx prisma db pull
npx prisma generate
```

### Connection Errors

**Problem**: `Can't reach database server`

**Solution**:

1. Check `DATABASE_URL` in `.env`
2. Ensure you're using the **direct connection** URL (not pooled)
3. Verify database is accessible from your location

---

## Related Documentation

- **Type Safety**: `/docs/TYPE_SAFETY.md`
- **Security**: `/docs/SECURITY.md`
- **Bank Parsers**: `/docs/BANK_PARSERS.md`
- **AI Providers**: `/docs/AI_PROVIDERS.md`

---

**Prisma Integration Status**: ✅ **FULLY IMPLEMENTED**
