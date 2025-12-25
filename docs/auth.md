# Authentication

## Critical Rules

**This application uses Clerk as the exclusive authentication provider. All authentication patterns must follow the standards defined in this document.**

### Required Authentication Provider

- ✅ **Clerk ONLY**: All authentication must use `@clerk/nextjs`
- ❌ **No other providers**: NextAuth, Auth0, Firebase Auth, custom solutions are prohibited

### Allowed Authentication Patterns

- ✅ **Server Components**: Use `auth()` from `@clerk/nextjs/server` in async Server Components
- ✅ **Client Components**: Use hooks from `@clerk/nextjs` (`useUser`, `useAuth`, `useClerk`)
- ✅ **Server Actions**: Use `auth()` from `@clerk/nextjs/server` in Server Actions
- ✅ **Route Handlers**: Use `auth()` from `@clerk/nextjs/server` in API routes (if needed)

### Prohibited Authentication Patterns

- ❌ **Deprecated Clerk APIs**: Never use `authMiddleware()` (use `clerkMiddleware()` instead)
- ❌ **Client-side auth checks for security**: Never rely solely on client-side auth for access control
- ❌ **Hardcoded user IDs**: Never bypass authentication with hardcoded values
- ❌ **Session tokens in client storage**: Never manually store or manage session tokens

## Environment Configuration

### Required Environment Variables

All Clerk keys must be defined in `.env.local`:

```bash
# Get these from https://dashboard.clerk.com/last-active?path=api-keys

# Publishable key (safe to expose to client)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Secret key (NEVER expose to client)
CLERK_SECRET_KEY=sk_test_...
```

**Security Notes**:
- ✅ **DO**: Keep `.env.local` in `.gitignore`
- ✅ **DO**: Rotate keys if accidentally exposed
- ❌ **DO NOT**: Commit keys to version control
- ❌ **DO NOT**: Use production keys in development

## Middleware Configuration

### Required Setup (`middleware.ts`)

The middleware must be configured at the root of your project:

```typescript
// middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
```

**Important**:
- This runs on every request (except static files)
- Authentication happens automatically
- No need to manually verify tokens
- API routes are always protected by middleware

### Advanced Middleware (Protected Routes)

To protect specific routes and redirect unauthenticated users:

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/workouts(.*)',
  '/exercises(.*)',
  '/progress(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Redirect unauthenticated users to sign-in
  if (isProtectedRoute(req) && !userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

## Server-Side Authentication

### Pattern 1: Server Components (Primary Pattern)

**This is the most common authentication pattern in the application.**

```typescript
// app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // 1. Get authentication state
  const { userId } = await auth();

  // 2. Handle unauthenticated users
  if (!userId) {
    redirect("/sign-in");
  }

  // 3. User is authenticated - proceed with page logic
  return (
    <div>
      <h1>Dashboard</h1>
      <p>User ID: {userId}</p>
    </div>
  );
}
```

**Security Note**: The `userId` from `auth()` is cryptographically verified and can be trusted. Always use this for database queries and access control.

### Pattern 2: Getting Full User Object

When you need more than just the `userId`:

```typescript
// app/profile/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  // Get full user object with email, name, etc.
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div>
      <h1>Profile</h1>
      <p>Email: {user.emailAddresses[0]?.emailAddress}</p>
      <p>Name: {user.firstName} {user.lastName}</p>
    </div>
  );
}
```

**When to use**:
- ✅ Use `auth()` when you only need `userId` (most common)
- ✅ Use `currentUser()` when you need email, name, or other user metadata
- ❌ Don't use `currentUser()` if `auth()` is sufficient (performance)

### Pattern 3: Server Actions

All Server Actions must authenticate before performing mutations:

```typescript
// app/actions/workouts.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createWorkout } from "@/data/workouts";

export async function createWorkoutAction(formData: FormData) {
  // 1. Authenticate first
  const { userId } = await auth();

  // 2. Reject if not authenticated
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // 3. Perform mutation with verified userId
  const name = formData.get("name") as string;
  await createWorkout({ name, userId });

  // 4. Revalidate relevant paths
  revalidatePath("/dashboard/workouts");

  return { success: true };
}
```

**Critical Security Rule**: Never trust client-supplied user IDs. Always use the `userId` from `auth()`.

### Pattern 4: Route Handlers (API Routes)

Only create API routes when necessary (external webhooks, third-party integrations). For internal operations, prefer Server Actions.

```typescript
// app/api/workouts/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getWorkoutsByUserId } from "@/data/workouts";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const workouts = await getWorkoutsByUserId(userId);
  return NextResponse.json({ workouts });
}
```

## Client-Side Authentication

### Pattern 1: Conditional Rendering Based on Auth State

```typescript
// components/header.tsx
"use client";

import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from "@clerk/nextjs";

export function Header() {
  return (
    <header>
      <SignedOut>
        {/* Show to unauthenticated users */}
        <SignInButton mode="modal">
          <button>Sign In</button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button>Sign Up</button>
        </SignUpButton>
      </SignedOut>

      <SignedIn>
        {/* Show to authenticated users */}
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </header>
  );
}
```

**Important**: These components (`<SignedIn>`, `<SignedOut>`) are for UI only. Never use them for access control or security.

### Pattern 2: Using the useUser Hook

```typescript
// components/profile-dropdown.tsx
"use client";

import { useUser } from "@clerk/nextjs";

export function ProfileDropdown() {
  const { user, isLoaded, isSignedIn } = useUser();

  // Handle loading state
  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  // Handle unauthenticated state
  if (!isSignedIn || !user) {
    return null;
  }

  // Render user information
  return (
    <div>
      <p>Welcome, {user.firstName}!</p>
      <p>{user.emailAddresses[0]?.emailAddress}</p>
    </div>
  );
}
```

### Pattern 3: Using the useAuth Hook

For programmatic auth checks and operations:

```typescript
// components/logout-button.tsx
"use client";

import { useAuth } from "@clerk/nextjs";

export function LogoutButton() {
  const { isLoaded, userId, signOut } = useAuth();

  if (!isLoaded || !userId) {
    return null;
  }

  return (
    <button onClick={() => signOut()}>
      Sign Out
    </button>
  );
}
```

### Pattern 4: Accessing Clerk Instance

For advanced operations (session management, organization switching):

```typescript
// components/organization-switcher.tsx
"use client";

import { useClerk } from "@clerk/nextjs";

export function OrganizationSwitcher() {
  const { clerk } = useClerk();

  if (!clerk) {
    return null;
  }

  return (
    <button onClick={() => clerk.openOrganizationProfile()}>
      Manage Organization
    </button>
  );
}
```

## Layout Integration

### Root Layout Setup (`app/layout.tsx`)

The root layout must wrap the entire app with `<ClerkProvider>`:

```typescript
// app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

**Critical**: `<ClerkProvider>` must be at the root. Never nest it deeper or create multiple instances.

## Authentication UI Components

### Built-in Clerk Components

Clerk provides pre-built, customizable components:

```typescript
import {
  SignIn,          // Full sign-in form
  SignUp,          // Full sign-up form
  UserButton,      // User avatar dropdown
  UserProfile,     // Full user profile editor
  SignInButton,    // Trigger sign-in modal
  SignUpButton,    // Trigger sign-up modal
  SignOutButton,   // Sign out button
} from "@clerk/nextjs";
```

### Creating Sign-In Page

```typescript
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
```

### Creating Sign-Up Page

```typescript
// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
          },
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
      />
    </div>
  );
}
```

**Note**: The `[[...sign-in]]` and `[[...sign-up]]` catch-all routes are required for Clerk's routing to work properly.

## Security Best Practices

### 1. Never Trust Client-Supplied User IDs

❌ **WRONG**:
```typescript
// NEVER DO THIS - Security vulnerability!
export async function deleteWorkout(workoutId: string, userId: string) {
  // Client could pass any userId
  await db.delete(workouts).where(eq(workouts.id, workoutId));
}
```

✅ **CORRECT**:
```typescript
// ALWAYS verify userId server-side
"use server";

import { auth } from "@clerk/nextjs/server";

export async function deleteWorkoutAction(workoutId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Now userId is cryptographically verified
  await deleteWorkout(workoutId, userId);
}
```

### 2. Always Validate Authentication Before Data Access

Every protected Server Component and Server Action must check authentication:

```typescript
// ✅ Good
export default async function ProtectedPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Safe to proceed
}

// ❌ Bad - Missing auth check
export default async function ProtectedPage() {
  // Directly accessing data without auth check
  const data = await getData();
}
```

### 3. Use Middleware for Route Protection

For routes that should always require authentication, use middleware to redirect at the edge:

```typescript
// middleware.ts - handles auth before page even loads
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect(); // Automatically redirects if not authenticated
  }
});
```

### 4. Environment Variable Security

- ✅ **DO**: Use `.env.local` for local development
- ✅ **DO**: Use platform environment variables for production (Vercel, etc.)
- ✅ **DO**: Rotate keys immediately if exposed
- ❌ **DO NOT**: Commit `.env` files to version control
- ❌ **DO NOT**: Share secret keys in chat, email, or documentation

### 5. Session Security

- ✅ Clerk handles session management automatically
- ✅ Sessions are stored in HTTP-only cookies (safe from XSS)
- ✅ Tokens are automatically refreshed
- ❌ Never manually read or write session tokens
- ❌ Never store auth state in localStorage or client-side storage

## Common Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Using Deprecated authMiddleware

```typescript
// NEVER USE - This is deprecated!
import { authMiddleware } from "@clerk/nextjs";
export default authMiddleware();
```

✅ **Use Instead**:
```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";
export default clerkMiddleware();
```

### ❌ Anti-Pattern 2: Client-Side Access Control

```typescript
// WRONG - Client can bypass this!
"use client";
import { useUser } from "@clerk/nextjs";

export function ProtectedComponent() {
  const { user } = useUser();
  if (!user) return null; // Not secure!

  return <SensitiveData />; // Client could modify code to show this
}
```

✅ **Use Instead**: Server-side protection
```typescript
// Server Component - truly protected
import { auth } from "@clerk/nextjs/server";

export default async function ProtectedPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <SensitiveData />;
}
```

### ❌ Anti-Pattern 3: Mixing Authentication Providers

```typescript
// NEVER DO THIS
import { getServerSession } from "next-auth"; // Wrong provider!
```

✅ **Always use Clerk exclusively**:
```typescript
import { auth } from "@clerk/nextjs/server";
```

### ❌ Anti-Pattern 4: Forgetting to Check Auth in Server Actions

```typescript
// WRONG - No auth check!
"use server";
export async function dangerousAction() {
  await db.delete(allData); // Anyone could call this!
}
```

✅ **Always check auth first**:
```typescript
"use server";
import { auth } from "@clerk/nextjs/server";

export async function safeAction() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Now safe to proceed
}
```

## Testing Authentication

### Development Testing

1. **Sign Up Flow**: Test account creation with email verification
2. **Sign In Flow**: Test various sign-in methods (email, OAuth, etc.)
3. **Protected Routes**: Verify redirects work correctly
4. **Sign Out**: Ensure sessions are properly cleared
5. **Session Persistence**: Test page refreshes maintain session

### Testing Authenticated States

```typescript
// Example test helper (not using Clerk's test tokens)
// For local development only
export async function getCurrentUserId() {
  const { userId } = await auth();
  return userId;
}
```

**Important**: Never create test backdoors that bypass authentication in production code.

## Integration with Data Fetching

Authentication and data fetching work together to ensure data isolation. See [data-fetching.md](./data-fetching.md) for complete examples.

### Quick Reference

```typescript
// Server Component with auth + data fetching
import { auth } from "@clerk/nextjs/server";
import { getWorkoutsByUserId } from "@/data/workouts";
import { redirect } from "next/navigation";

export default async function WorkoutsPage() {
  // 1. Authenticate
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // 2. Fetch data filtered by userId
  const workouts = await getWorkoutsByUserId(userId);

  // 3. Render
  return <WorkoutList workouts={workouts} />;
}
```

## Troubleshooting

### Issue: "Clerk: auth() and currentUser() are only available in App Router"

**Cause**: Trying to use Clerk in Pages Router or outside App Router context.

**Solution**: Ensure you're using App Router (files in `app/` directory).

### Issue: Environment variables not found

**Cause**: Missing or incorrectly named environment variables.

**Solution**:
1. Check `.env.local` exists and contains correct keys
2. Restart development server after adding variables
3. Verify keys are prefixed correctly (`NEXT_PUBLIC_` for client-side)

### Issue: Infinite redirect loops

**Cause**: Middleware redirecting authenticated users incorrectly.

**Solution**: Check your middleware logic and route matchers carefully.

### Issue: Session not persisting

**Cause**: Cookie configuration or domain issues.

**Solution**: Check that you're not blocking third-party cookies in development.

## Summary

1. ✅ **Use Clerk exclusively** for all authentication
2. ✅ **Always use `auth()`** in Server Components and Server Actions
3. ✅ **Check authentication** before any protected operation
4. ✅ **Never trust client-supplied user IDs** - always verify server-side
5. ✅ **Use `clerkMiddleware()`** for route protection
6. ✅ **Keep secret keys secure** - never commit to version control
7. ❌ **Never use deprecated APIs** like `authMiddleware()`
8. ❌ **Never rely on client-side auth** for access control
9. ❌ **Never manually manage sessions** - let Clerk handle it

**These authentication patterns are critical for security. No exceptions.**

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk API Reference](https://clerk.com/docs/reference/clerkjs)
- [Project Data Fetching Guide](./data-fetching.md)
