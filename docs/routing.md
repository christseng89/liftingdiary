# Routing Standards

This document defines the routing architecture and conventions for the Lifting Diary application.

## Route Structure

All application routes must be accessed via the `/dashboard` prefix. The root path `/` serves as the public landing page.

```
/                           # Public landing page
/dashboard                  # Protected dashboard home
/dashboard/workouts         # Protected workouts list
/dashboard/workouts/[id]    # Protected workout detail
/dashboard/workouts/new     # Protected create workout
/dashboard/exercises        # Protected exercises list
/dashboard/progress         # Protected progress tracking
```

## Route Protection

### Authentication Requirements

All `/dashboard` routes and their subpages are protected routes that require user authentication. Unauthenticated users attempting to access these routes must be redirected to the sign-in page.

### Implementation Pattern

Route protection is handled using **Next.js 16 proxy pattern** via `proxy.ts` in the project root.

**File**: `proxy.ts`

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define protected routes using route matcher
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',  // Protects /dashboard and all subpaths
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect all /dashboard routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
```

### Key Implementation Rules

1. **Use `proxy.ts`, not `middleware.ts`**: Next.js 16 uses the proxy pattern instead of the deprecated middleware pattern.

2. **Clerk's `clerkMiddleware()`**: Import from `@clerk/nextjs/server` for authentication handling.

3. **Route Matcher**: Use `createRouteMatcher()` to define protected route patterns:
   - `/dashboard(.*)` protects `/dashboard` and all nested routes
   - More specific matchers can be added for granular control

4. **`auth.protect()`**: Call this method to enforce authentication on matched routes. This will:
   - Redirect unauthenticated users to Clerk's sign-in page
   - Allow authenticated users to proceed
   - Automatically handle redirect-back after sign-in

5. **Matcher Config**: The `config.matcher` array defines which requests run through the proxy:
   - Excludes static files and Next.js internals for performance
   - Always includes API routes for proper authentication

## Route Organization

### Route Groups

Use Next.js route groups `(group-name)` to organize routes without affecting URLs:

```
app/
├── (public)/              # Public routes (no auth required)
│   ├── page.tsx           # Landing page at /
│   └── about/page.tsx     # About page at /about
├── (dashboard)/           # Protected dashboard routes
│   ├── layout.tsx         # Dashboard-specific layout
│   ├── dashboard/
│   │   └── page.tsx       # Dashboard home at /dashboard
│   │   ├── workouts/
│   │   │   ├── page.tsx   # /dashboard/workouts
│   │   │   ├── [id]/page.tsx  # /dashboard/workouts/[id]
│   │   │   └── new/page.tsx   # /dashboard/workouts/new
│   │   ├── exercises/
│   │   │   └── page.tsx   # /dashboard/exercises
│   │   └── progress/
│   │       └── page.tsx   # /dashboard/progress
├── layout.tsx             # Root layout
└── globals.css
```

### Dashboard Layout

Create a dedicated layout for dashboard routes to share common UI (navigation, sidebar, etc.):

**File**: `app/(dashboard)/layout.tsx`

```typescript
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/nav/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Double-check authentication at layout level (defense in depth)
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
```

## Page Component Patterns

### Protected Page (Next.js 16)

All page components that use route parameters MUST follow the Next.js 16 async params pattern:

```typescript
// ✅ CORRECT - Next.js 16 pattern
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}

export default async function WorkoutDetailPage({
  params,
  searchParams
}: PageProps) {
  // MUST await params and searchParams
  const { id } = await params;
  const { date } = await searchParams;

  // Access user authentication
  const { userId } = await auth();

  // Fetch data using awaited params
  const workout = await fetchWorkout(id, userId);

  return (
    <div>
      <h1>Workout {id}</h1>
      {/* Render workout details */}
    </div>
  );
}
```

### Navigation

Use Next.js `Link` component for client-side navigation:

```typescript
import Link from "next/link";

export function WorkoutsList({ workouts }) {
  return (
    <ul>
      {workouts.map((workout) => (
        <li key={workout.id}>
          <Link href={`/dashboard/workouts/${workout.id}`}>
            {workout.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

### Programmatic Navigation

For programmatic navigation (e.g., after form submission), use `useRouter` from `next/navigation`:

```typescript
"use client";

import { useRouter } from "next/navigation";

export function CreateWorkoutForm() {
  const router = useRouter();

  async function handleSubmit(data: FormData) {
    const result = await createWorkout(data);

    if (result.success) {
      // Navigate to new workout detail page
      router.push(`/dashboard/workouts/${result.workoutId}`);
    }
  }

  return (
    <form action={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## Dynamic Routes

### File-based Routing

Next.js uses file-system-based routing. Dynamic segments use square brackets:

- `[id]` - Single dynamic segment (e.g., `/dashboard/workouts/123`)
- `[...slug]` - Catch-all segment (e.g., `/dashboard/exercises/chest/bench-press`)
- `[[...slug]]` - Optional catch-all (e.g., `/dashboard/progress` or `/dashboard/progress/2024/12`)

### Type-Safe Dynamic Routes

Always type your route parameters:

```typescript
interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  // Validate and parse ID if needed
  const workoutId = parseInt(id, 10);

  if (isNaN(workoutId)) {
    notFound(); // Show 404 page
  }

  // Use validated ID
  const workout = await fetchWorkout(workoutId);

  return <>{/* render */}</>;
}
```

## Redirects and Rewrites

### Server-Side Redirects

Use `redirect()` from `next/navigation` in Server Components:

```typescript
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function WorkoutPage({ params }: PageProps) {
  const { userId } = await auth();
  const { id } = await params;

  const workout = await fetchWorkout(id);

  // Redirect if workout doesn't belong to user
  if (workout.userId !== userId) {
    redirect("/dashboard/workouts");
  }

  return <>{/* render */}</>;
}
```

### Client-Side Redirects

Use `useRouter().push()` or `useRouter().replace()`:

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RedirectIfUnauthorized({ hasAccess }: { hasAccess: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!hasAccess) {
      router.replace("/dashboard");
    }
  }, [hasAccess, router]);

  return null;
}
```

## Security Best Practices

1. **Defense in Depth**:
   - Primary protection in `proxy.ts`
   - Secondary check in dashboard layout
   - Tertiary validation in individual pages if needed

2. **User ID Validation**:
   - Always verify resource ownership using `auth().userId`
   - Never trust client-provided user identifiers

3. **Parameter Validation**:
   - Always validate and sanitize route parameters
   - Use `notFound()` for invalid resources
   - Use `redirect()` for unauthorized access

4. **Error Handling**:
   - Use `error.tsx` for error boundaries
   - Use `not-found.tsx` for 404 pages
   - Never expose sensitive error details to clients

## Testing Routes

### Manual Testing Checklist

For each protected route:
- [ ] Unauthenticated access redirects to sign-in
- [ ] Authenticated access succeeds
- [ ] Invalid IDs show 404 page
- [ ] Unauthorized resource access redirects appropriately
- [ ] Browser back button works correctly after redirect

### Example Test Flow

1. Access `/dashboard/workouts` while logged out → redirects to sign-in
2. Sign in → redirects back to `/dashboard/workouts`
3. Access `/dashboard/workouts/999999` → shows 404
4. Access another user's workout → redirects to `/dashboard/workouts`

## Common Mistakes to Avoid

### ❌ WRONG: Using deprecated middleware pattern

```typescript
// DON'T: This is the old Next.js 14 pattern
export default async function middleware(request: NextRequest) {
  // Deprecated pattern
}
```

### ❌ WRONG: Not awaiting params

```typescript
// DON'T: This will cause runtime errors in Next.js 16
export default async function Page({ params }: PageProps) {
  const id = params.id; // ❌ params is a Promise!
}
```

### ❌ WRONG: Client-side-only protection

```typescript
// DON'T: Client-side checks can be bypassed
"use client";
export default function ProtectedPage() {
  const { user } = useUser();
  if (!user) return <div>Please sign in</div>; // ❌ Not secure
}
```

### ✅ CORRECT: Server-side protection with proxy

```typescript
// DO: Use proxy.ts for protection
// proxy.ts handles authentication
// Page components receive authenticated context

export default async function ProtectedPage({ params }: PageProps) {
  const { userId } = await auth(); // Already authenticated by proxy
  const { id } = await params; // Properly await params

  // Secure server-side rendering
}
```

## Summary

- **All routes** in the app are accessed via `/dashboard` prefix (except public landing)
- **All `/dashboard` routes** are protected and require authentication
- **Use `proxy.ts`** with Clerk's `clerkMiddleware()` for route protection
- **Always await** `params` and `searchParams` in Next.js 16 pages
- **Validate ownership** of resources using `auth().userId`
- **Use route groups** `(dashboard)` for organization without URL impact
- **Create dedicated layout** for dashboard routes to share common UI
