# Data Fetching

## Critical Rules

**All data fetching in this application MUST be done via Server Components. This is non-negotiable.**

### Allowed Data Fetching Method

- ✅ **Server Components ONLY**: All data fetching must happen in Server Components using async/await

### Prohibited Data Fetching Methods

- ❌ **Route Handlers**: Never fetch data via API routes or route handlers
- ❌ **Client Components**: Never fetch data in Client Components (no useEffect with fetch, no client-side queries)
- ❌ **Any Other Mechanism**: No exceptions to the Server Component rule

## Database Query Architecture

### Helper Functions in /data Directory

**All database queries must be performed through helper functions located in the `/data` directory.**

```typescript
// Example: /data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getWorkoutsByUserId(userId: string) {
  return await db.select().from(workouts).where(eq(workouts.userId, userId));
}
```

### Drizzle ORM Requirement

- ✅ **All queries must use Drizzle ORM**
- ❌ **Raw SQL is prohibited**

Drizzle provides type safety and prevents SQL injection vulnerabilities. Always use Drizzle's query builder.

## Security: User Data Isolation

**CRITICAL SECURITY REQUIREMENT**: A logged-in user can ONLY access their own data. Users must NEVER be able to access data belonging to other users.

### Implementation Requirements

1. **Always filter by userId**: Every database query must filter by the authenticated user's ID
2. **Server-side authentication check**: Always verify the user is authenticated before querying data
3. **No client-supplied IDs**: Never trust user IDs from client-side code or URL parameters for access control

### Example: Secure Data Fetching

```typescript
// app/dashboard/workouts/page.tsx
import { auth } from "@clerk/nextjs/server";
import { getWorkoutsByUserId } from "@/data/workouts";
import { redirect } from "next/navigation";

export default async function WorkoutsPage() {
  // 1. Authenticate the user
  const { userId } = await auth();

  // 2. Redirect if not authenticated
  if (!userId) {
    redirect("/sign-in");
  }

  // 3. Fetch data filtered by authenticated userId
  const workouts = await getWorkoutsByUserId(userId);

  return (
    <div>
      {/* Render workouts */}
    </div>
  );
}
```

```typescript
// /data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getWorkoutsByUserId(userId: string) {
  // Always filter by userId to ensure data isolation
  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId));
}

export async function getWorkoutById(workoutId: string, userId: string) {
  // Even when fetching by ID, ALWAYS verify userId ownership
  const results = await db
    .select()
    .from(workouts)
    .where(eq(workouts.id, workoutId))
    .where(eq(workouts.userId, userId));

  return results[0] || null;
}
```

## Benefits of This Architecture

1. **Security**: Server Components prevent exposing database credentials to the client
2. **Performance**: Data fetching happens on the server, reducing client bundle size
3. **Type Safety**: Drizzle ORM provides end-to-end type safety
4. **Simplicity**: No need for API routes or client-side state management for data fetching
5. **Data Isolation**: Enforcing userId filtering in `/data` helpers ensures users cannot access others' data

## Common Patterns

### Pattern 1: List View

```typescript
// app/dashboard/workouts/page.tsx
import { auth } from "@clerk/nextjs/server";
import { getWorkoutsByUserId } from "@/data/workouts";

export default async function WorkoutsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workouts = await getWorkoutsByUserId(userId);

  return <WorkoutList workouts={workouts} />;
}
```

### Pattern 2: Detail View

```typescript
// app/dashboard/workouts/[id]/page.tsx
import { auth } from "@clerk/nextjs/server";
import { getWorkoutById } from "@/data/workouts";
import { notFound } from "next/navigation";

export default async function WorkoutDetailPage({
  params
}: {
  params: { id: string }
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // userId parameter ensures user can only access their own workout
  const workout = await getWorkoutById(params.id, userId);

  if (!workout) {
    notFound();
  }

  return <WorkoutDetail workout={workout} />;
}
```

### Pattern 3: Nested Data

```typescript
// /data/workouts.ts
export async function getWorkoutWithExercises(workoutId: string, userId: string) {
  const workout = await db.query.workouts.findFirst({
    where: (workouts, { eq, and }) =>
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)  // Always enforce userId
      ),
    with: {
      exercises: true,  // Drizzle relational query
    },
  });

  return workout;
}
```

## What About Mutations?

For data mutations (create, update, delete), use **Server Actions** that also enforce userId filtering:

```typescript
// app/actions/workouts.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createWorkout, deleteWorkout } from "@/data/workouts";

export async function createWorkoutAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const name = formData.get("name") as string;

  await createWorkout({ name, userId });
  revalidatePath("/dashboard/workouts");
}

export async function deleteWorkoutAction(workoutId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Delete function in /data will verify userId ownership
  await deleteWorkout(workoutId, userId);
  revalidatePath("/dashboard/workouts");
}
```

## Summary

1. ✅ **Fetch data in Server Components** using async/await
2. ✅ **Create helper functions in /data directory** for all database operations
3. ✅ **Use Drizzle ORM** for all queries (no raw SQL)
4. ✅ **Always authenticate** and verify userId before fetching data
5. ✅ **Always filter by userId** to enforce data isolation
6. ❌ **Never fetch data** in route handlers, client components, or via any other method

**These rules are critical for security, performance, and maintainability. No exceptions.**
