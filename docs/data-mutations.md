# Data Mutations

## Critical Rules

**All data mutations (create, update, delete operations) in this application MUST follow the patterns defined in this document. This is non-negotiable.**

### Required Architecture

- ✅ **Helper Functions in /data**: All database mutations must be performed through helper functions in the `/data` directory
- ✅ **Drizzle ORM ONLY**: All mutations must use Drizzle ORM (no raw SQL)
- ✅ **Server Actions ONLY**: All mutations must be executed via Server Actions in colocated `actions.ts` files
- ✅ **Explicit Typing**: Server Action parameters MUST be explicitly typed (NOT FormData)
- ✅ **Zod Validation**: Every Server Action MUST validate inputs using Zod before executing database logic

### Prohibited Mutation Methods

- ❌ **Route Handlers**: Never perform mutations via API routes or route handlers
- ❌ **Client Components**: Never mutate data directly in Client Components
- ❌ **FormData Type**: Never use FormData as a Server Action parameter type
- ❌ **Raw SQL**: Never use raw SQL for mutations
- ❌ **Unvalidated Inputs**: Never execute mutations without Zod validation

## Architecture Overview

### Three-Layer Mutation Pattern

All data mutations follow this three-layer architecture:

```
1. Client Component (UI)
        ↓
2. Server Action (actions.ts) - Validates with Zod, authenticates
        ↓
3. Data Helper Function (/data) - Executes mutation with Drizzle ORM
```

**Example Flow**:
```typescript
// 1. Client Component calls Server Action
<form action={createWorkoutAction}>

// 2. Server Action validates and authenticates
export async function createWorkoutAction(input: CreateWorkoutInput) {
  const validated = createWorkoutSchema.parse(input);
  const { userId } = await auth();
  return await createWorkout(validated, userId);
}

// 3. Data helper performs the mutation
export async function createWorkout(data: WorkoutData, userId: string) {
  return await db.insert(workouts).values({ ...data, userId });
}
```

## Layer 1: Data Helper Functions (/data)

### Location and Structure

All mutation helper functions must be located in the `/data` directory:

```
data/
├── workouts.ts       # Workout mutations and queries
├── exercises.ts      # Exercise mutations and queries
├── sets.ts           # Set mutations and queries
└── user-settings.ts  # User settings mutations
```

### Required Patterns

#### Pattern 1: Create (Insert)

```typescript
// data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";

export type CreateWorkoutData = {
  name: string;
  startedAt: Date;
  notes?: string;
};

export async function createWorkout(
  data: CreateWorkoutData,
  userId: string
) {
  const [workout] = await db
    .insert(workouts)
    .values({
      ...data,
      userId, // Always include userId for data isolation
    })
    .returning();

  return workout;
}
```

**Requirements**:
- ✅ Always include `userId` in the insert
- ✅ Use `.returning()` to get the created record
- ✅ Use explicit types for the data parameter
- ✅ Accept `userId` as a separate parameter (verified by Server Action)

#### Pattern 2: Update

```typescript
// data/workouts.ts
import { eq, and } from "drizzle-orm";

export type UpdateWorkoutData = {
  name?: string;
  notes?: string;
  completedAt?: Date;
};

export async function updateWorkout(
  workoutId: number,
  data: UpdateWorkoutData,
  userId: string
) {
  // CRITICAL: Always verify userId ownership in WHERE clause
  const [updated] = await db
    .update(workouts)
    .set(data)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // Security: verify ownership
      )
    )
    .returning();

  return updated || null;
}
```

**Security Requirements**:
- ✅ **ALWAYS verify userId in WHERE clause** - this prevents users from updating others' data
- ✅ Return `null` if no record was updated (unauthorized or not found)
- ✅ Use `and()` to combine id and userId conditions

#### Pattern 3: Delete

```typescript
// data/workouts.ts
export async function deleteWorkout(
  workoutId: number,
  userId: string
): Promise<boolean> {
  // CRITICAL: Always verify userId ownership
  const [deleted] = await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // Security: verify ownership
      )
    )
    .returning({ id: workouts.id });

  return !!deleted;
}
```

**Security Requirements**:
- ✅ **ALWAYS verify userId in WHERE clause**
- ✅ Return boolean indicating success
- ✅ Never delete without userId verification

#### Pattern 4: Complex Mutations (Transactions)

For operations involving multiple tables:

```typescript
// data/workouts.ts
import { workoutExercises, sets } from "@/db/schema";

export type CreateWorkoutWithExercisesData = {
  workout: CreateWorkoutData;
  exercises: {
    exerciseDefinitionId: number;
    order: number;
    sets: {
      reps: number;
      weight: number;
      order: number;
    }[];
  }[];
};

export async function createWorkoutWithExercises(
  data: CreateWorkoutWithExercisesData,
  userId: string
) {
  // Use transaction for atomic operations
  return await db.transaction(async (tx) => {
    // 1. Create workout
    const [workout] = await tx
      .insert(workouts)
      .values({ ...data.workout, userId })
      .returning();

    // 2. Create exercises
    for (const exercise of data.exercises) {
      const [workoutExercise] = await tx
        .insert(workoutExercises)
        .values({
          workoutId: workout.id,
          exerciseDefinitionId: exercise.exerciseDefinitionId,
          order: exercise.order,
        })
        .returning();

      // 3. Create sets
      const setsToInsert = exercise.sets.map(set => ({
        workoutExerciseId: workoutExercise.id,
        reps: set.reps,
        weight: set.weight,
        order: set.order,
      }));

      await tx.insert(sets).values(setsToInsert);
    }

    return workout;
  });
}
```

**Transaction Requirements**:
- ✅ Use `db.transaction()` for operations spanning multiple tables
- ✅ All operations inside transaction succeed or all fail (atomicity)
- ✅ Still verify userId for security

## Layer 2: Server Actions (actions.ts)

### Location and Structure

Server Actions must be colocated with the features that use them:

```
app/
├── dashboard/
│   └── workouts/
│       ├── actions.ts        # Workout-related actions
│       ├── page.tsx
│       └── [id]/
│           ├── actions.ts    # Single workout actions
│           └── page.tsx
├── exercises/
│   ├── actions.ts            # Exercise-related actions
│   └── page.tsx
└── actions.ts                # Global actions (if needed)
```

### Required File Structure

Every `actions.ts` file must:

1. Start with `"use server"` directive
2. Import Zod schemas
3. Import authentication helpers
4. Import data helper functions
5. Export validated, authenticated action functions

### Pattern 1: Basic Server Action

```typescript
// app/dashboard/workouts/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createWorkout } from "@/data/workouts";

// 1. Define Zod schema for validation
const createWorkoutSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  startedAt: z.date(),
  notes: z.string().max(500, "Notes too long").optional(),
});

// 2. Define explicit input type (NOT FormData)
type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

// 3. Export Server Action with explicit typing
export async function createWorkoutAction(input: CreateWorkoutInput) {
  // 4. Validate input with Zod (throws on validation error)
  const validated = createWorkoutSchema.parse(input);

  // 5. Authenticate user
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // 6. Call data helper function
  const workout = await createWorkout(validated, userId);

  // 7. Revalidate affected paths
  revalidatePath("/dashboard/workouts");

  // 8. Return success (or redirect)
  return { success: true, workoutId: workout.id };
}
```

**Critical Requirements**:
- ✅ **MUST use `"use server"` directive** at the top of the file
- ✅ **MUST validate with Zod** before any logic
- ✅ **MUST authenticate** before mutations
- ✅ **MUST use explicit types** (NOT FormData)
- ✅ **MUST revalidate paths** after mutations
- ✅ **MUST include userId** when calling data helpers

### Pattern 2: Update Action

```typescript
// app/dashboard/workouts/[id]/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateWorkout } from "@/data/workouts";

const updateWorkoutSchema = z.object({
  workoutId: z.number(),
  name: z.string().min(1).max(100).optional(),
  notes: z.string().max(500).optional(),
  completedAt: z.date().optional(),
});

type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;

export async function updateWorkoutAction(input: UpdateWorkoutInput) {
  // 1. Validate
  const validated = updateWorkoutSchema.parse(input);

  // 2. Authenticate
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // 3. Perform mutation (userId ensures ownership)
  const { workoutId, ...data } = validated;
  const updated = await updateWorkout(workoutId, data, userId);

  // 4. Handle not found/unauthorized
  if (!updated) {
    throw new Error("Workout not found or unauthorized");
  }

  // 5. Revalidate
  revalidatePath(`/dashboard/workouts/${workoutId}`);
  revalidatePath("/dashboard/workouts");

  return { success: true, workout: updated };
}
```

### Pattern 3: Delete Action

```typescript
// app/dashboard/workouts/[id]/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { deleteWorkout } from "@/data/workouts";

const deleteWorkoutSchema = z.object({
  workoutId: z.number(),
});

type DeleteWorkoutInput = z.infer<typeof deleteWorkoutSchema>;

export async function deleteWorkoutAction(input: DeleteWorkoutInput) {
  // 1. Validate
  const validated = deleteWorkoutSchema.parse(input);

  // 2. Authenticate
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // 3. Perform deletion (userId ensures ownership)
  const deleted = await deleteWorkout(validated.workoutId, userId);

  // 4. Handle not found/unauthorized
  if (!deleted) {
    throw new Error("Workout not found or unauthorized");
  }

  // 5. Revalidate and redirect
  revalidatePath("/dashboard/workouts");
  redirect("/dashboard/workouts");
}
```

### Pattern 4: Complex Action with Nested Data

```typescript
// app/dashboard/workouts/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createWorkoutWithExercises } from "@/data/workouts";

// Nested Zod schema
const createWorkoutWithExercisesSchema = z.object({
  workout: z.object({
    name: z.string().min(1).max(100),
    startedAt: z.date(),
    notes: z.string().max(500).optional(),
  }),
  exercises: z.array(
    z.object({
      exerciseDefinitionId: z.number(),
      order: z.number(),
      sets: z.array(
        z.object({
          reps: z.number().min(1).max(999),
          weight: z.number().min(0).max(9999),
          order: z.number(),
        })
      ),
    })
  ).min(1, "At least one exercise required"),
});

type CreateWorkoutWithExercisesInput = z.infer<
  typeof createWorkoutWithExercisesSchema
>;

export async function createWorkoutWithExercisesAction(
  input: CreateWorkoutWithExercisesInput
) {
  // 1. Validate nested structure
  const validated = createWorkoutWithExercisesSchema.parse(input);

  // 2. Authenticate
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // 3. Call transactional data helper
  const workout = await createWorkoutWithExercises(validated, userId);

  // 4. Revalidate
  revalidatePath("/dashboard/workouts");

  return { success: true, workoutId: workout.id };
}
```

### Pattern 5: Handling Redirects (Client-Side)

**CRITICAL RULE: Server Actions MUST NOT use `redirect()` from `next/navigation` for post-mutation navigation. Always return a redirect URL and handle navigation on the client side.**

#### Why Client-Side Redirects?

Server-side redirects in Server Actions (`redirect()` from `next/navigation`) cause navigation by throwing an error internally. This approach:
- ❌ Makes error handling complex (redirect throws, success doesn't)
- ❌ Prevents returning success data alongside navigation
- ❌ Can't be easily tested or debugged
- ❌ Doesn't work well with `useActionState` patterns

Client-side redirects provide:
- ✅ Consistent return types (always return a result object)
- ✅ Better error handling (no thrown errors for success cases)
- ✅ Full control over navigation timing in the client
- ✅ Ability to show loading states during navigation

#### ❌ WRONG: Server-Side Redirect

```typescript
// app/dashboard/workouts/new/actions.ts
"use server";

import { redirect } from "next/navigation"; // DON'T DO THIS
import { revalidatePath } from "next/cache";
import { createWorkout } from "@/data/workouts";

export async function createWorkoutAction(input: CreateWorkoutInput) {
  const validated = createWorkoutSchema.parse(input);
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await createWorkout(validated, userId);

  revalidatePath("/dashboard/workouts");

  // BAD: Server-side redirect throws internally
  redirect("/dashboard/workouts");
}
```

#### ✅ CORRECT: Client-Side Redirect

**Server Action** (returns redirect URL):

```typescript
// app/dashboard/workouts/new/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createWorkout } from "@/data/workouts";

const createWorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  startedAt: z.date(),
  notes: z.string().max(500).optional(),
  redirectDate: z.string().optional(), // Optional redirect parameter
});

type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

// Define discriminated union return type
type ActionResult =
  | {
      success: true;
      redirectUrl: string; // Return URL for client-side navigation
    }
  | {
      success: false;
      error: string;
      issues?: z.ZodIssue[];
    };

export async function createWorkoutAction(
  input: CreateWorkoutInput
): Promise<ActionResult> {
  try {
    const validated = createWorkoutSchema.parse(input);

    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Extract redirect parameters before mutation
    const { redirectDate, ...workoutData } = validated;

    await createWorkout(workoutData, userId);

    // Build redirect URL based on input
    const redirectUrl = redirectDate
      ? `/dashboard/workouts?date=${redirectDate}`
      : "/dashboard/workouts";

    revalidatePath("/dashboard/workouts");

    // GOOD: Return success with redirect URL
    return {
      success: true,
      redirectUrl,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        issues: error.issues,
      };
    }

    console.error("Failed to create workout:", error);
    return {
      success: false,
      error: "Failed to create workout. Please try again.",
    };
  }
}
```

**Client Component** (handles redirect):

```typescript
// app/dashboard/workouts/new/create-workout-form.tsx
"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createWorkoutAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Match the Server Action's return type
type ActionState =
  | {
      success: true;
      redirectUrl: string;
    }
  | {
      success: false;
      error: string;
      issues?: z.ZodIssue[];
    }
  | null;

export function CreateWorkoutForm({ selectedDate }: { selectedDate: Date }) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState: ActionState, formData: FormData): Promise<ActionState> => {
      const input = {
        name: formData.get("name") as string,
        startedAt: new Date(formData.get("startedAt") as string),
        notes: formData.get("notes") as string || undefined,
        redirectDate: formData.get("redirectDate") as string,
      };

      // Call Server Action - returns success or error
      return await createWorkoutAction(input);
    },
    null
  );

  // GOOD: Handle client-side redirect on success
  useEffect(() => {
    if (state?.success) {
      router.push(state.redirectUrl);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <Input name="name" placeholder="Workout name" required />
      <Input name="startedAt" type="datetime-local" required />
      <Input name="notes" placeholder="Notes" />
      <input type="hidden" name="redirectDate" value={selectedDate.toISOString()} />

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Workout"}
      </Button>

      {/* Type-safe error display */}
      {state && !state.success && state.error && (
        <p className="text-red-600">{state.error}</p>
      )}
    </form>
  );
}
```

#### Key Points

1. **Return Type**: Server Actions that need to redirect must return a discriminated union:
   ```typescript
   type ActionResult =
     | { success: true; redirectUrl: string }
     | { success: false; error: string };
   ```

2. **No Redirect Import**: Never import `redirect` from `next/navigation` in Server Actions for post-mutation navigation

3. **useEffect Pattern**: Use `useEffect` in the client component to watch for success state and call `router.push()`

4. **Type Safety**: Client `ActionState` type must match the Server Action's return type

5. **Consistent Returns**: All code paths return the same result shape (success or error), never throw for navigation

6. **Error Handling**: Wrap in try-catch and return error objects instead of throwing

7. **Optional Parameters**: You can pass redirect parameters (like dates, IDs) through the action input to customize the redirect URL

#### When to Use Client-Side vs Server-Side Redirects

**Use Client-Side Redirects** (Return URL):
- ✅ After form submissions with Server Actions
- ✅ When using `useActionState` hook
- ✅ When you need consistent return types
- ✅ When navigation depends on action result data

**Use Server-Side Redirects** (`redirect()` function):
- ✅ In Server Components (not Server Actions)
- ✅ For authentication checks (e.g., redirect to login)
- ✅ For page-level redirects (e.g., middleware, layout)
- ✅ When you need immediate navigation without client interaction

#### Example: Authentication Redirect (Server Component - OK to use redirect())

```typescript
// app/dashboard/workouts/new/page.tsx (Server Component)
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation"; // OK in Server Components
import { CreateWorkoutForm } from "./create-workout-form";

export default async function NewWorkoutPage() {
  const { userId } = await auth();

  if (!userId) {
    // GOOD: Server-side redirect in Server Component
    redirect("/sign-in");
  }

  return <CreateWorkoutForm />;
}
```

## Layer 3: Client Components (Usage)

### Calling Server Actions from Client Components

#### Pattern 1: Form Action (Recommended)

```typescript
// app/dashboard/workouts/create-workout-form.tsx
"use client";

import { useActionState } from "react";
import { createWorkoutAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateWorkoutForm() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      // Extract and type form data
      const input = {
        name: formData.get("name") as string,
        startedAt: new Date(formData.get("startedAt") as string),
        notes: formData.get("notes") as string | undefined,
      };

      // Call Server Action with typed input
      return await createWorkoutAction(input);
    },
    null
  );

  return (
    <form action={formAction}>
      <Input name="name" placeholder="Workout name" required />
      <Input name="startedAt" type="datetime-local" required />
      <Input name="notes" placeholder="Notes (optional)" />

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Workout"}
      </Button>

      {state?.success && <p>Workout created successfully!</p>}
    </form>
  );
}
```

**Important**:
- ✅ Extract FormData values and create typed object
- ✅ Pass typed object to Server Action (NOT FormData)
- ✅ Use `useActionState` for loading and error states

#### Pattern 2: Programmatic Action Call

```typescript
// app/dashboard/workouts/workout-card.tsx
"use client";

import { useState } from "react";
import { deleteWorkoutAction } from "./actions";
import { Button } from "@/components/ui/button";

export function WorkoutCard({ workoutId }: { workoutId: number }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this workout?")) return;

    setIsDeleting(true);
    try {
      // Call Server Action with typed object
      await deleteWorkoutAction({ workoutId });
    } catch (error) {
      console.error("Failed to delete workout:", error);
      alert("Failed to delete workout");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <h3>Workout</h3>
      <Button onClick={handleDelete} disabled={isDeleting}>
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
```

## Zod Validation Patterns

### Common Zod Schema Patterns

#### String Validation

```typescript
const schema = z.object({
  // Required string with length constraints
  name: z.string().min(1, "Name required").max(100, "Too long"),

  // Optional string
  notes: z.string().max(500).optional(),

  // Email validation
  email: z.string().email("Invalid email"),

  // URL validation
  website: z.string().url("Invalid URL").optional(),

  // Enum/literal values
  status: z.enum(["pending", "active", "completed"]),
});
```

#### Number Validation

```typescript
const schema = z.object({
  // Integer with range
  reps: z.number().int().min(1).max(999),

  // Positive number
  weight: z.number().min(0).max(9999),

  // ID (positive integer)
  exerciseId: z.number().int().positive(),
});
```

#### Date Validation

```typescript
const schema = z.object({
  // Any date
  startedAt: z.date(),

  // Date in the past
  completedAt: z.date().max(new Date(), "Cannot be in future"),

  // Optional date
  scheduledFor: z.date().optional(),
});
```

#### Array Validation

```typescript
const schema = z.object({
  // Non-empty array
  exercises: z.array(z.object({
    id: z.number(),
    name: z.string(),
  })).min(1, "At least one exercise required"),

  // Optional array
  tags: z.array(z.string()).optional(),
});
```

#### Custom Validation

```typescript
const schema = z.object({
  weight: z.number()
    .refine(val => val > 0, "Weight must be positive")
    .refine(val => val < 10000, "Weight too high"),

  password: z.string()
    .min(8, "Password too short")
    .refine(
      val => /[A-Z]/.test(val),
      "Must contain uppercase letter"
    ),
});
```

### Error Handling

```typescript
// Server Action with proper error handling
export async function createWorkoutAction(input: CreateWorkoutInput) {
  try {
    // Zod will throw ZodError if validation fails
    const validated = createWorkoutSchema.parse(input);

    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const workout = await createWorkout(validated, userId);

    revalidatePath("/dashboard/workouts");

    return { success: true, workoutId: workout.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return validation errors to client
      return {
        success: false,
        error: "Validation failed",
        issues: error.issues,
      };
    }

    // Log unexpected errors
    console.error("Failed to create workout:", error);

    return {
      success: false,
      error: "Failed to create workout",
    };
  }
}
```

## Security Best Practices

### 1. Always Verify userId in Data Helpers

❌ **WRONG - Security Vulnerability**:
```typescript
// NEVER DO THIS
export async function deleteWorkout(workoutId: number) {
  // Missing userId check - any user could delete any workout!
  await db.delete(workouts).where(eq(workouts.id, workoutId));
}
```

✅ **CORRECT - Secure**:
```typescript
export async function deleteWorkout(workoutId: number, userId: string) {
  // Verify ownership before deletion
  await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)
      )
    );
}
```

### 2. Never Trust Client Input

❌ **WRONG**:
```typescript
// NEVER DO THIS
export async function updateWorkoutAction(input: any) {
  // No validation - client could send malicious data
  const { userId } = await auth();
  await updateWorkout(input.id, input, userId);
}
```

✅ **CORRECT**:
```typescript
export async function updateWorkoutAction(input: UpdateWorkoutInput) {
  // Validate first - Zod will throw on invalid data
  const validated = updateWorkoutSchema.parse(input);
  const { userId } = await auth();
  await updateWorkout(validated.id, validated, userId);
}
```

### 3. Always Authenticate Before Mutations

❌ **WRONG**:
```typescript
// NEVER DO THIS
export async function createWorkoutAction(input: CreateWorkoutInput) {
  // No auth check - anyone could create data
  const validated = createWorkoutSchema.parse(input);
  await createWorkout(validated, "some-user-id");
}
```

✅ **CORRECT**:
```typescript
export async function createWorkoutAction(input: CreateWorkoutInput) {
  const validated = createWorkoutSchema.parse(input);

  // Always authenticate
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await createWorkout(validated, userId);
}
```

### 4. Use Transactions for Multi-Table Operations

❌ **WRONG**:
```typescript
// NEVER DO THIS - Not atomic!
export async function createWorkoutWithExercises(data: any, userId: string) {
  // If exercises insert fails, workout already exists (orphaned data)
  const workout = await db.insert(workouts).values({...}).returning();
  await db.insert(exercises).values({...}); // Could fail!
}
```

✅ **CORRECT**:
```typescript
export async function createWorkoutWithExercises(data: any, userId: string) {
  // All-or-nothing: either everything succeeds or everything fails
  return await db.transaction(async (tx) => {
    const workout = await tx.insert(workouts).values({...}).returning();
    await tx.insert(exercises).values({...});
    return workout;
  });
}
```

## Common Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Using FormData as Server Action Parameter

```typescript
// WRONG - Don't use FormData type
export async function createWorkoutAction(formData: FormData) {
  const name = formData.get("name") as string;
  // ... BAD!
}
```

✅ **Use explicit types**:
```typescript
type CreateWorkoutInput = {
  name: string;
  startedAt: Date;
};

export async function createWorkoutAction(input: CreateWorkoutInput) {
  // ... GOOD!
}
```

### ❌ Anti-Pattern 2: Skipping Zod Validation

```typescript
// WRONG - No validation
export async function createWorkoutAction(input: CreateWorkoutInput) {
  const { userId } = await auth();
  await createWorkout(input, userId); // Dangerous!
}
```

✅ **Always validate**:
```typescript
export async function createWorkoutAction(input: CreateWorkoutInput) {
  const validated = createWorkoutSchema.parse(input); // GOOD!
  const { userId } = await auth();
  await createWorkout(validated, userId);
}
```

### ❌ Anti-Pattern 3: Performing Mutations in Route Handlers

```typescript
// WRONG - Don't use API routes for mutations
// app/api/workouts/route.ts
export async function POST(request: Request) {
  // BAD!
}
```

✅ **Use Server Actions**:
```typescript
// app/dashboard/workouts/actions.ts
"use server";
export async function createWorkoutAction(input: CreateWorkoutInput) {
  // GOOD!
}
```

### ❌ Anti-Pattern 4: Not Revalidating After Mutations

```typescript
// WRONG - No revalidation
export async function createWorkoutAction(input: CreateWorkoutInput) {
  const validated = createWorkoutSchema.parse(input);
  const { userId } = await auth();
  const workout = await createWorkout(validated, userId);

  // Missing revalidatePath - UI won't update!
  return { success: true };
}
```

✅ **Always revalidate**:
```typescript
export async function createWorkoutAction(input: CreateWorkoutInput) {
  const validated = createWorkoutSchema.parse(input);
  const { userId } = await auth();
  const workout = await createWorkout(validated, userId);

  revalidatePath("/dashboard/workouts"); // GOOD!
  return { success: true };
}
```

## Complete Example

Here's a complete, production-ready example showing all three layers:

### Step 1: Data Helper Function

```typescript
// data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type CreateWorkoutData = {
  name: string;
  startedAt: Date;
  notes?: string;
};

export async function createWorkout(
  data: CreateWorkoutData,
  userId: string
) {
  const [workout] = await db
    .insert(workouts)
    .values({ ...data, userId })
    .returning();

  return workout;
}

export async function updateWorkout(
  workoutId: number,
  data: Partial<CreateWorkoutData>,
  userId: string
) {
  const [updated] = await db
    .update(workouts)
    .set(data)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .returning();

  return updated || null;
}

export async function deleteWorkout(
  workoutId: number,
  userId: string
): Promise<boolean> {
  const [deleted] = await db
    .delete(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .returning({ id: workouts.id });

  return !!deleted;
}
```

### Step 2: Server Actions

```typescript
// app/dashboard/workouts/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createWorkout,
  updateWorkout,
  deleteWorkout,
} from "@/data/workouts";

// Schemas
const createWorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  startedAt: z.date(),
  notes: z.string().max(500).optional(),
});

const updateWorkoutSchema = z.object({
  workoutId: z.number(),
  name: z.string().min(1).max(100).optional(),
  notes: z.string().max(500).optional(),
});

const deleteWorkoutSchema = z.object({
  workoutId: z.number(),
});

// Types
type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;
type DeleteWorkoutInput = z.infer<typeof deleteWorkoutSchema>;

// Actions
export async function createWorkoutAction(input: CreateWorkoutInput) {
  const validated = createWorkoutSchema.parse(input);
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const workout = await createWorkout(validated, userId);

  revalidatePath("/dashboard/workouts");

  return { success: true, workoutId: workout.id };
}

export async function updateWorkoutAction(input: UpdateWorkoutInput) {
  const validated = updateWorkoutSchema.parse(input);
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { workoutId, ...data } = validated;
  const updated = await updateWorkout(workoutId, data, userId);

  if (!updated) throw new Error("Workout not found");

  revalidatePath(`/dashboard/workouts/${workoutId}`);
  revalidatePath("/dashboard/workouts");

  return { success: true };
}

export async function deleteWorkoutAction(input: DeleteWorkoutInput) {
  const validated = deleteWorkoutSchema.parse(input);
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const deleted = await deleteWorkout(validated.workoutId, userId);

  if (!deleted) throw new Error("Workout not found");

  revalidatePath("/dashboard/workouts");

  return { success: true };
}
```

### Step 3: Client Component

```typescript
// app/dashboard/workouts/create-workout-form.tsx
"use client";

import { useActionState } from "react";
import { createWorkoutAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CreateWorkoutForm() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const input = {
        name: formData.get("name") as string,
        startedAt: new Date(formData.get("startedAt") as string),
        notes: (formData.get("notes") as string) || undefined,
      };

      try {
        return await createWorkoutAction(input);
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name">Workout Name</label>
        <Input
          id="name"
          name="name"
          placeholder="Morning workout"
          required
        />
      </div>

      <div>
        <label htmlFor="startedAt">Started At</label>
        <Input
          id="startedAt"
          name="startedAt"
          type="datetime-local"
          required
        />
      </div>

      <div>
        <label htmlFor="notes">Notes (optional)</label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Add notes..."
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Workout"}
      </Button>

      {state?.success && (
        <p className="text-green-600">Workout created successfully!</p>
      )}

      {state?.error && (
        <p className="text-red-600">Error: {state.error}</p>
      )}
    </form>
  );
}
```

## Summary

1. ✅ **Helper functions in /data** - All mutations through Drizzle ORM
2. ✅ **Server Actions in actions.ts** - Colocated with features
3. ✅ **Explicit typing** - Never use FormData as parameter type
4. ✅ **Zod validation** - Always validate before executing logic
5. ✅ **Authentication required** - Check userId before all mutations
6. ✅ **Verify ownership** - Always include userId in WHERE clauses
7. ✅ **Use transactions** - For multi-table operations
8. ✅ **Revalidate paths** - Update cache after mutations
9. ❌ **Never skip validation** - Security risk
10. ❌ **Never use API routes** - Use Server Actions instead

**These patterns are critical for security, data integrity, and maintainability. No exceptions.**

## Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Zod Documentation](https://zod.dev/)
- [Project Data Fetching Guide](./data-fetching.md)
- [Project Authentication Guide](./auth.md)
