# Server Components

## Critical Rules

**All Server Components in this Next.js 16+ application MUST follow the patterns defined in this document. This is non-negotiable.**

### Required Patterns

- ✅ **Async Functions**: All Server Components must be async functions
- ✅ **Await Params**: Route params MUST be awaited (they are Promises in Next.js 15+)
- ✅ **Await SearchParams**: Search params MUST be awaited (they are Promises in Next.js 15+)
- ✅ **Direct Data Fetching**: Fetch data directly in Server Components using async/await
- ✅ **Type Safety**: Use proper TypeScript types for params and searchParams

### Prohibited Patterns

- ❌ **Synchronous Access**: Never access params or searchParams without awaiting
- ❌ **useEffect for Data Fetching**: Never use useEffect in Server Components
- ❌ **Client-Side State**: Never use useState, useReducer in Server Components
- ❌ **Browser APIs**: Never use window, document, localStorage in Server Components

## Next.js 15+ Breaking Change: Params are Promises

**CRITICAL**: In Next.js 15 and later, route `params` and `searchParams` are asynchronous and return Promises. You MUST await them before accessing their values.

### Why This Change?

Next.js 15+ made params and searchParams asynchronous to enable:
- Better performance through streaming
- Improved Partial Prerendering (PPR)
- More efficient server-side rendering

### The Pattern

```typescript
// ✅ CORRECT - Next.js 15+ Pattern
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ query?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  // MUST await params before accessing
  const { id } = await params;

  // MUST await searchParams before accessing
  const { query } = await searchParams;

  // Now you can use the resolved values
  const data = await fetchData(id);

  return <div>{data.name}</div>;
}
```

```typescript
// ❌ WRONG - Old Pattern (Next.js 14 and below)
interface PageProps {
  params: { id: string }; // Not a Promise
  searchParams: { query?: string }; // Not a Promise
}

export default async function Page({ params, searchParams }: PageProps) {
  // This will cause TypeScript errors in Next.js 15+
  const { id } = params; // ERROR: params is a Promise!
  const { query } = searchParams; // ERROR: searchParams is a Promise!
}
```

## Server Component Patterns

### Pattern 1: Dynamic Route with Params

**Use Case**: Page that displays a single resource by ID

```typescript
// app/dashboard/workout/[workoutId]/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getWorkoutById } from "@/data/workouts";

interface WorkoutPageProps {
  params: Promise<{ workoutId: string }>;
}

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  // 1. Authenticate
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // 2. Await params to resolve the Promise
  const { workoutId } = await params;

  // 3. Parse and validate the ID
  const workoutIdNum = parseInt(workoutId, 10);
  if (isNaN(workoutIdNum)) {
    notFound();
  }

  // 4. Fetch data with userId verification
  const workout = await getWorkoutById(workoutIdNum, userId);

  if (!workout) {
    notFound();
  }

  // 5. Render the component
  return (
    <div>
      <h1>{workout.name}</h1>
      {/* ... */}
    </div>
  );
}
```

**Key Points**:
- ✅ `params` is typed as `Promise<{ workoutId: string }>`
- ✅ `await params` before accessing properties
- ✅ Validate parsed values (check for NaN, null, etc.)
- ✅ Use `notFound()` for invalid IDs
- ✅ Verify ownership with userId

### Pattern 2: List Page with Search Params

**Use Case**: Page with filtering, sorting, or pagination via URL query params

```typescript
// app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getWorkoutsByUserIdAndDate } from "@/data/workouts";

interface DashboardPageProps {
  searchParams: Promise<{
    date?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function DashboardPage({
  searchParams
}: DashboardPageProps) {
  // 1. Authenticate
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // 2. Await searchParams to resolve the Promise
  const params = await searchParams;

  // 3. Extract and parse values with defaults
  const selectedDate = params.date ? new Date(params.date) : new Date();
  const sortOrder = params.sort || "desc";
  const page = parseInt(params.page || "1", 10);

  // 4. Fetch data based on params
  const workouts = await getWorkoutsByUserIdAndDate(userId, selectedDate);

  // 5. Render
  return (
    <div>
      <h1>Workouts for {selectedDate.toDateString()}</h1>
      {/* ... */}
    </div>
  );
}
```

**Key Points**:
- ✅ `searchParams` is typed as `Promise<{ ... }>`
- ✅ `await searchParams` before accessing properties
- ✅ Provide default values for optional params
- ✅ Validate and sanitize user input
- ✅ Use params for filtering, pagination, sorting

### Pattern 3: Combined Params and SearchParams

**Use Case**: Dynamic route with additional query parameters

```typescript
// app/dashboard/workout/[workoutId]/page.tsx
interface EditWorkoutPageProps {
  params: Promise<{ workoutId: string }>;
  searchParams: Promise<{ date?: string; tab?: string }>;
}

export default async function EditWorkoutPage({
  params,
  searchParams,
}: EditWorkoutPageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Await BOTH params and searchParams
  const { workoutId } = await params;
  const { date, tab } = await searchParams;

  const workoutIdNum = parseInt(workoutId, 10);
  if (isNaN(workoutIdNum)) {
    notFound();
  }

  const workout = await getWorkoutById(workoutIdNum, userId);
  if (!workout) {
    notFound();
  }

  // Use searchParams for UI state (redirect URL, active tab, etc.)
  const redirectDate = date || new Date().toISOString();
  const activeTab = tab || "details";

  return (
    <div>
      <EditWorkoutForm
        workout={workout}
        redirectDate={redirectDate}
        activeTab={activeTab}
      />
    </div>
  );
}
```

**Key Points**:
- ✅ Await both `params` and `searchParams` separately
- ✅ Use params for resource identification
- ✅ Use searchParams for UI state and options
- ✅ Pass searchParams to client components as needed

### Pattern 4: Nested Routes

**Use Case**: Deeply nested dynamic routes

```typescript
// app/dashboard/workout/[workoutId]/exercise/[exerciseId]/page.tsx
interface ExercisePageProps {
  params: Promise<{
    workoutId: string;
    exerciseId: string;
  }>;
}

export default async function ExercisePage({ params }: ExercisePageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Await params to get all dynamic segments
  const { workoutId, exerciseId } = await params;

  const workoutIdNum = parseInt(workoutId, 10);
  const exerciseIdNum = parseInt(exerciseId, 10);

  if (isNaN(workoutIdNum) || isNaN(exerciseIdNum)) {
    notFound();
  }

  // Fetch nested data with ownership verification
  const exercise = await getExerciseById(
    workoutIdNum,
    exerciseIdNum,
    userId
  );

  if (!exercise) {
    notFound();
  }

  return <ExerciseDetail exercise={exercise} />;
}
```

**Key Points**:
- ✅ All dynamic segments are in the params Promise
- ✅ Validate all IDs before database queries
- ✅ Always verify ownership at every level

## TypeScript Types for Server Components

### Type Definitions

```typescript
// Correct type for dynamic route params
interface PageProps {
  params: Promise<{
    // Single dynamic segment
    id: string;

    // Multiple dynamic segments
    // workoutId: string;
    // exerciseId: string;

    // Catch-all segment (optional)
    // slug?: string[];
  }>;
  searchParams: Promise<{
    // All search params are optional strings
    query?: string;
    page?: string;
    sort?: string;
    filter?: string;
  }>;
}
```

### Type Helper for Awaited Params

```typescript
// Optional: Create a type helper for resolved params
type ResolvedParams<T> = T extends Promise<infer U> ? U : never;

// Usage
interface PageProps {
  params: Promise<{ id: string }>;
}

type Params = ResolvedParams<PageProps['params']>; // { id: string }
```

## Common Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Not Awaiting Params

```typescript
// WRONG - Will cause TypeScript and runtime errors
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = params; // ERROR: params is a Promise!
  return <div>{id}</div>;
}
```

✅ **Correct**:
```typescript
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // GOOD: await first
  return <div>{id}</div>;
}
```

### ❌ Anti-Pattern 2: Destructuring Before Await

```typescript
// WRONG - Destructuring a Promise doesn't work
export default async function Page({
  params: { id } // ERROR: Can't destructure a Promise!
}: {
  params: Promise<{ id: string }>
}) {
  return <div>{id}</div>;
}
```

✅ **Correct**:
```typescript
export default async function Page({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params; // Await first, then destructure
  return <div>{id}</div>;
}
```

### ❌ Anti-Pattern 3: Using Old Next.js 14 Types

```typescript
// WRONG - Old Next.js 14 pattern
interface PageProps {
  params: { id: string }; // Not a Promise (outdated)
  searchParams: { query?: string }; // Not a Promise (outdated)
}
```

✅ **Correct**:
```typescript
// CORRECT - Next.js 15+ pattern
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ query?: string }>;
}
```

### ❌ Anti-Pattern 4: Not Handling Invalid Params

```typescript
// WRONG - No validation
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idNum = parseInt(id, 10); // Could be NaN!

  const data = await getData(idNum); // Could query with NaN
  return <div>{data.name}</div>;
}
```

✅ **Correct**:
```typescript
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idNum = parseInt(id, 10);

  // Validate before using
  if (isNaN(idNum)) {
    notFound();
  }

  const data = await getData(idNum);
  return <div>{data.name}</div>;
}
```

### ❌ Anti-Pattern 5: Using Client Component Patterns

```typescript
// WRONG - Client component patterns in Server Component
"use client"; // Don't mark as client just to avoid async!

import { useEffect, useState } from "react";

export default function Page({ params }: { params: { id: string } }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    // BAD: Fetching in useEffect instead of Server Component
    fetch(`/api/data/${params.id}`).then(/* ... */);
  }, [params.id]);

  return <div>{data?.name}</div>;
}
```

✅ **Correct**:
```typescript
// GOOD - Server Component with direct data fetching
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idNum = parseInt(id, 10);

  if (isNaN(idNum)) {
    notFound();
  }

  // Fetch directly in Server Component
  const data = await getData(idNum);

  return <div>{data.name}</div>;
}
```

## Server Component Benefits

### Why Use Server Components?

1. **Performance**: No JavaScript shipped to client for Server Components
2. **Security**: Database queries and API keys stay on server
3. **SEO**: Content is rendered on server, fully available to crawlers
4. **Direct Data Access**: No need for API routes or client-side fetching
5. **Automatic Request Deduplication**: Next.js deduplicates identical requests

### When to Use Server Components

✅ **Use Server Components for**:
- Data fetching from databases
- Accessing backend services
- Reading environment variables
- Rendering static content
- SEO-critical content
- Large dependencies that don't need to run on client

❌ **Don't Use Server Components for**:
- Interactive elements (onClick, onChange)
- React hooks (useState, useEffect, useContext)
- Browser APIs (localStorage, window, document)
- Event listeners
- Client-side state management

## Server Component Composition

### Pattern: Server Component with Client Component Children

```typescript
// app/dashboard/page.tsx (Server Component)
import { auth } from "@clerk/nextjs/server";
import { getWorkouts } from "@/data/workouts";
import { WorkoutList } from "./workout-list"; // Client Component

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Fetch data in Server Component
  const workouts = await getWorkouts(userId);

  // Pass data to Client Component as props
  return (
    <div>
      <h1>Dashboard</h1>
      <WorkoutList workouts={workouts} />
    </div>
  );
}
```

```typescript
// app/dashboard/workout-list.tsx (Client Component)
"use client";

import { useState } from "react";

interface WorkoutListProps {
  workouts: Workout[];
}

export function WorkoutList({ workouts }: WorkoutListProps) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div>
      {workouts.map(workout => (
        <div
          key={workout.id}
          onClick={() => setSelected(workout.id)}
        >
          {workout.name}
        </div>
      ))}
    </div>
  );
}
```

**Key Points**:
- ✅ Fetch data in Server Component
- ✅ Pass data to Client Component via props
- ✅ Keep interactivity in Client Component
- ✅ Minimize Client Component JavaScript

## Loading and Error States

### Loading UI

```typescript
// app/dashboard/workout/[workoutId]/loading.tsx
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  );
}
```

### Error UI

```typescript
// app/dashboard/workout/[workoutId]/error.tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### Not Found UI

```typescript
// app/dashboard/workout/[workoutId]/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h2>Workout Not Found</h2>
      <p>The workout you're looking for doesn't exist or you don't have access.</p>
    </div>
  );
}
```

## Metadata Generation

### Static Metadata

```typescript
// app/dashboard/workout/[workoutId]/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Workout",
  description: "Edit your workout details",
};
```

### Dynamic Metadata

```typescript
// app/dashboard/workout/[workoutId]/page.tsx
import { Metadata } from "next";
import { getWorkoutById } from "@/data/workouts";

interface PageProps {
  params: Promise<{ workoutId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { workoutId } = await params;
  const workoutIdNum = parseInt(workoutId, 10);

  if (isNaN(workoutIdNum)) {
    return { title: "Workout Not Found" };
  }

  // Note: generateMetadata doesn't have access to auth()
  // Only fetch public data here, or data that doesn't require auth
  const workout = await getWorkoutById(workoutIdNum);

  return {
    title: workout ? `Edit ${workout.name}` : "Workout Not Found",
    description: `Edit workout: ${workout?.name}`,
  };
}
```

## Migration Guide: Next.js 14 → 16

### Before (Next.js 14)

```typescript
interface PageProps {
  params: { id: string };
  searchParams: { query?: string };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = params; // Direct access
  const { query } = searchParams; // Direct access

  const data = await getData(id);
  return <div>{data.name}</div>;
}
```

### After (Next.js 15+)

```typescript
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ query?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params; // MUST await
  const { query } = await searchParams; // MUST await

  const data = await getData(id);
  return <div>{data.name}</div>;
}
```

### Migration Checklist

- [ ] Update all `params` types to `Promise<{ ... }>`
- [ ] Update all `searchParams` types to `Promise<{ ... }>`
- [ ] Add `await` before accessing `params`
- [ ] Add `await` before accessing `searchParams`
- [ ] Test all dynamic routes
- [ ] Test all pages with search params
- [ ] Update TypeScript types
- [ ] Run `npm run build` to check for errors

## Summary

1. ✅ **Always await params** - They are Promises in Next.js 15+
2. ✅ **Always await searchParams** - They are Promises in Next.js 15+
3. ✅ **Validate parsed values** - Check for NaN, null, undefined
4. ✅ **Use notFound()** - For invalid or missing resources
5. ✅ **Type correctly** - Use `Promise<{ ... }>` for params
6. ✅ **Fetch data directly** - No need for useEffect or API routes
7. ✅ **Verify authentication** - Always check userId before data access
8. ❌ **Never destructure params directly** - Await first, then destructure
9. ❌ **Never use client patterns** - No useState, useEffect in Server Components
10. ❌ **Never skip validation** - Always handle invalid input

**These patterns are critical for Next.js 16 Server Components. No exceptions.**

## Additional Resources

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Next.js 15 Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [Project Authentication Guide](./auth.md)
- [Project Data Fetching Guide](./data-fetching.md)
