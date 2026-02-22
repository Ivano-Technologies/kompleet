# KOMPLEET Platform: UI Implementation Contract

**Document Purpose:** Technical contract defining how UI components must be implemented. All developers must follow these rules.

**Last Updated:** February 13, 2026  
**Status:** Non-Negotiable System Constraint

---

## 1. Component Architecture

### File Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (public)/          # Public route group
│   ├── (dashboard)/       # Protected route group
│   └── page.tsx           # Landing page
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   └── forms/            # Form components
├── lib/                  # Utilities and helpers
│   ├── supabase/        # Supabase client/server
│   └── utils.ts         # Helper functions
└── styles/              # Global styles
```

### Component Naming

- **Pages:** `page.tsx` (Next.js App Router convention)
- **Components:** PascalCase (e.g., `SolidCard.tsx`)
- **Utilities:** camelCase (e.g., `formatCurrency.ts`)
- **Types:** PascalCase with `.types.ts` suffix (e.g., `Transaction.types.ts`)

---

## 2. Styling Rules

### Tailwind CSS Only

```tsx
// ✅ CORRECT - Use Tailwind classes
<div className="bg-light-surface dark:bg-dark-surface p-6 rounded-xl">

// ❌ WRONG - No inline styles
<div style={{ background: '#F9FAFB', padding: '24px' }}>

// ❌ WRONG - No CSS modules
<div className={styles.card}>
```

### Design Token Usage

```tsx
// ✅ CORRECT - Use design tokens
<div className="text-light-text-primary dark:text-dark-text-primary">

// ❌ WRONG - Hardcoded colors
<div className="text-[#0F172A]">

// ❌ WRONG - Arbitrary values (unless absolutely necessary)
<div className="text-[rgb(15,23,42)]">
```

### Theme-Adaptive Classes

```tsx
// ✅ CORRECT - Light/Dark variants
<div className="bg-white dark:bg-dark-background">
<p className="text-light-text-primary dark:text-dark-text-primary">

// ❌ WRONG - Single theme only
<div className="bg-white">
<p className="text-gray-900">
```

### No Glassmorphism

```tsx
// ❌ FORBIDDEN - Glassmorphism
<div className="backdrop-blur-md bg-white/10">
<div style={{ backdropFilter: 'blur(12px)' }}>

// ✅ CORRECT - Solid surfaces
<div className="bg-light-surface dark:bg-dark-surface">
```

---

## 3. Component Patterns

### Solid Card Component

```tsx
// Standard solid card
<div className="solid-card bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-6 shadow-card">
  {children}
</div>

// Hover effect
<div className="solid-card hover-lift hover:shadow-card-hover">
  {children}
</div>
```

### Button Components

```tsx
// Primary button
<button className="btn-primary">
  Click Me
</button>

// Secondary button
<button className="btn-secondary">
  Cancel
</button>

// Ghost button
<button className="btn-ghost">
  Learn More
</button>

// Button with icon
<button className="btn-primary btn-with-icon">
  <span className="material-icons">add</span>
  Create New
</button>
```

### Input Components

```tsx
// Standard input
<input
  type="text"
  className="w-full px-4 py-3 bg-light-surface dark:bg-dark-surface-hover border border-light-border dark:border-dark-border rounded-lg text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
  placeholder="Enter text..."
/>

// Input with error state
<input
  className="border-error-light dark:border-error-dark focus:ring-error-light dark:focus:ring-error-dark"
/>
```

### Status Badges

```tsx
// Success status
<span className="status-success">
  Completed
</span>

// Pending status
<span className="status-pending">
  In Progress
</span>

// Failed status
<span className="status-failed">
  Failed
</span>
```

---

## 4. TypeScript Requirements

### Strict Mode

```tsx
// tsconfig.json must have:
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Component Props

```tsx
// ✅ CORRECT - Typed props
interface CardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Card({ title, description, children }: CardProps) {
  return <div>{children}</div>;
}

// ❌ WRONG - Untyped props
export function Card({ title, description, children }) {
  return <div>{children}</div>;
}
```

### Event Handlers

```tsx
// ✅ CORRECT - Typed event handlers
const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
  console.log("Clicked");
};

// ❌ WRONG - Untyped event handlers
const handleSubmit = (e) => {
  e.preventDefault();
};
```

### State Management

```tsx
// ✅ CORRECT - Typed state
const [user, setUser] = useState<User | null>(null);
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);

// ❌ WRONG - Untyped state
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(false);
```

---

## 5. Server vs Client Components

### Server Components (Default)

```tsx
// ✅ CORRECT - Server component (no 'use client')
export default async function DashboardPage() {
  const data = await fetchData(); // Can use async/await
  return <div>{data}</div>;
}
```

### Client Components (When Needed)

```tsx
// ✅ CORRECT - Client component (with 'use client')
"use client";

import { useState } from "react";

export default function InteractiveForm() {
  const [value, setValue] = useState("");
  return <input value={value} onChange={(e) => setValue(e.target.value)} />;
}
```

### When to Use Client Components

- State management (`useState`, `useReducer`)
- Event handlers (`onClick`, `onChange`)
- Browser APIs (`localStorage`, `window`)
- Third-party libraries that require browser context

---

## 6. Authentication Patterns

### Protected Routes

```tsx
// ✅ CORRECT - Server-side auth check
import { requireAuth } from "@/lib/auth";

export default async function ProtectedPage() {
  await requireAuth(); // Redirects if not authenticated
  return <div>Protected content</div>;
}
```

### Client-Side Auth State

```tsx
// ✅ CORRECT - Use Supabase client
"use client";

import { createSupabaseClient } from "@/lib/supabase/client";

export function UserProfile() {
  const supabase = createSupabaseClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  return <div>{user?.email}</div>;
}
```

---

## 7. Data Fetching

### Server Components

```tsx
// ✅ CORRECT - Fetch in server component
export default async function TransactionsPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from("transactions").select("*");

  return <TransactionList transactions={data} />;
}
```

### Client Components

```tsx
// ✅ CORRECT - Fetch in client component
"use client";

export function TransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createSupabaseClient();
      const { data } = await supabase.from("transactions").select("*");
      setTransactions(data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;
  return <div>{/* Render transactions */}</div>;
}
```

---

## 8. Error Handling

### Form Errors

```tsx
// ✅ CORRECT - Display errors to users
const [error, setError] = useState<string | null>(null);

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setError(null);

  try {
    await submitForm();
  } catch (err) {
    setError("An error occurred. Please try again.");
  }
};

return (
  <form onSubmit={handleSubmit}>
    {error && (
      <div className="p-3 bg-error-light/10 dark:bg-error-dark/10 border border-error-light dark:border-error-dark rounded-lg">
        <p className="text-error-light dark:text-error-dark text-sm">{error}</p>
      </div>
    )}
    {/* Form fields */}
  </form>
);
```

### API Errors

```tsx
// ✅ CORRECT - Handle Supabase errors
const { data, error } = await supabase.from("table").select("*");

if (error) {
  console.error("Database error:", error);
  setError("Failed to load data. Please try again.");
  return;
}
```

---

## 9. Loading States

### Skeleton Loaders

```tsx
// ✅ CORRECT - Show skeleton while loading
{
  loading ? (
    <div className="solid-card animate-pulse">
      <div className="h-4 bg-light-surface-hover dark:bg-dark-surface-hover rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-light-surface-hover dark:bg-dark-surface-hover rounded w-1/2"></div>
    </div>
  ) : (
    <div className="solid-card">{/* Actual content */}</div>
  );
}
```

### Button Loading

```tsx
// ✅ CORRECT - Disable button during loading
<button
  type="submit"
  disabled={loading}
  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
>
  {loading ? "Submitting..." : "Submit"}
</button>
```

---

## 10. Accessibility Requirements

### Semantic HTML

```tsx
// ✅ CORRECT - Use semantic elements
<nav>
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</nav>

<main>
  <h1>Page Title</h1>
  <article>{/* Content */}</article>
</main>

// ❌ WRONG - Div soup
<div>
  <div>
    <div><a href="/dashboard">Dashboard</a></div>
  </div>
</div>
```

### ARIA Labels

```tsx
// ✅ CORRECT - Add ARIA labels
<button aria-label="Close modal" onClick={onClose}>
  <span className="material-icons">close</span>
</button>

<input
  type="search"
  aria-label="Search transactions"
  placeholder="Search..."
/>
```

### Keyboard Navigation

```tsx
// ✅ CORRECT - Handle keyboard events
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      handleClick();
    }
  }}
>
  Click me
</div>
```

---

## 11. Performance Optimization

### Image Optimization

```tsx
// ✅ CORRECT - Use Next.js Image component
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="KOMPLEET Logo"
  width={200}
  height={50}
  priority // For above-the-fold images
/>

// ❌ WRONG - Regular img tag
<img src="/logo.png" alt="KOMPLEET Logo" />
```

### Dynamic Imports

```tsx
// ✅ CORRECT - Lazy load heavy components
import dynamic from "next/dynamic";

const HeavyChart = dynamic(() => import("@/components/HeavyChart"), {
  loading: () => <LoadingSpinner />,
  ssr: false, // Disable SSR if not needed
});
```

### Memoization

```tsx
// ✅ CORRECT - Memoize expensive calculations
import { useMemo } from "react";

const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);
```

---

## 12. Testing Requirements

### Component Tests

```tsx
// ✅ CORRECT - Test components
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

test("renders button with text", () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText("Click me")).toBeInTheDocument();
});
```

### Integration Tests

```tsx
// ✅ CORRECT - Test user flows
test("user can submit form", async () => {
  render(<SignupForm />);

  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "test@example.com" },
  });

  fireEvent.click(screen.getByText("Sign Up"));

  await waitFor(() => {
    expect(screen.getByText("Account created!")).toBeInTheDocument();
  });
});
```

---

## 13. Git Commit Standards

### Commit Message Format

```
Sprint X: [Component/Page] - [Action]

- Bullet point 1
- Bullet point 2
- No breaking changes
```

### Examples

```
Sprint 2: Landing page - Remove glassmorphism

- Removed all backdrop-filter and blur effects
- Implemented solid-card components
- Updated color tokens to use design system
- No backend logic changes

Sprint 3: Signup page - Implement solid design

- Replaced transparent backgrounds with solid surfaces
- Updated form inputs to use new design tokens
- Enhanced password strength indicator
- Maintained all Supabase auth logic
```

---

## 14. Code Review Checklist

### Before Submitting PR

- [ ] No TypeScript errors (`pnpm build`)
- [ ] No linting errors (`pnpm lint`)
- [ ] All tests pass (`pnpm test`)
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] Design tokens used (no hardcoded colors)
- [ ] Theme-adaptive (light/dark tested)
- [ ] Mobile responsive
- [ ] Accessibility checked
- [ ] Backend logic unchanged

---

## 15. Forbidden Patterns

### ❌ NEVER DO THIS:

```tsx
// Glassmorphism
<div className="backdrop-blur-md bg-white/10" />

// Inline styles
<div style={{ color: '#0A6847' }} />

// Untyped props
function Component({ data }) { }

// Any types
const user: any = getUser();

// Direct DOM manipulation
document.getElementById('element').style.color = 'red';

// Hardcoded colors
<div className="bg-[#F9FAFB]" />

// Missing error handling
await supabase.from('table').insert(data); // No error check

// Uncontrolled components (in forms)
<input defaultValue={value} /> // Use controlled inputs

// Missing loading states
<button onClick={handleSubmit}>Submit</button> // No loading indicator
```

---

## 16. Enforcement

### Automated Checks

- **TypeScript:** Strict mode enforced in `tsconfig.json`
- **ESLint:** Configured to catch common mistakes
- **Prettier:** Enforces consistent formatting
- **Husky:** Pre-commit hooks run linting and tests

### Manual Review

- All PRs require approval from tech lead
- Design review required for UI changes
- QA sign-off required before merge

---

**This contract is binding. All code must comply with these rules. No exceptions.**
