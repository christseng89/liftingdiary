# Workout Logging Database Schema - Plan & Implementation

**Project**: Lifting Diary
**Date**: 2025-12-22
**Status**: ✅ Completed and Deployed

---

## Overview

This document contains the complete plan and implementation details for the normalized database schema for workout logging using Drizzle ORM with PostgreSQL/Neon. The schema supports workouts with multiple exercises, each having multiple sets.

---

## Part 1: Implementation Plan

### User Requirements

- **Exercise approach**: Predefined catalog of exercises (shared across users)
- **Set tracking**: Weight (optional/nullable) and Reps only
- **Workout tracking**: Name, started_at, completed_at timestamps (duration calculated)
- **Bodyweight support**: Yes - weight field nullable for bodyweight exercises
- **Simplified design**: No notes, RPE, or metadata fields - focus on core workout data

### Schema Architecture

#### 4 Normalized Tables

1. **exercise_definitions** - Shared catalog of exercise types
   - Fields: id, name, description, is_active
   - Soft delete support via `is_active` flag
   - No userId (shared across all users)
   - Simplified: No metadata fields (muscle group, equipment, category removed)

2. **workouts** - User workout sessions
   - Links to Clerk userId (varchar)
   - Fields: name, started_at, completed_at
   - Timestamps: created_at, updated_at
   - Duration calculated from: (completed_at - started_at)
   - Indexed on (user_id, started_at) for efficient queries
   - Simplified: No date or notes fields

3. **workout_exercises** - Junction table linking exercises to workouts
   - Foreign keys: workout_id, exercise_id
   - `order` field preserves exercise sequence within workout
   - Cascade delete from workout, restrict delete from exercise definition
   - Simplified: No notes field, renamed exercise_definition_id → exercise_id

4. **exercise_sets** - Individual sets for each exercise
   - Foreign key: workout_exercise_id
   - Fields: order, reps (required), weight_lbs (nullable)
   - Cascade delete from workout_exercise
   - Simplified: No notes or rpe fields, renamed order_index → order

#### Relationships

- workouts (1) → (many) workout_exercises
- exercise_definitions (1) → (many) workout_exercises
- workout_exercises (1) → (many) exercise_sets

### Implementation Steps

#### Step 1: Define Schema (`db/schema.ts`)

Create complete table definitions with:

- Identity columns (modern PostgreSQL standard)
- Foreign key constraints with proper cascade/restrict rules
- Unique constraints on ordering (workout_id + order, workout_exercise_id + order)
- Proper nullable/required field settings (started_at, completed_at, weight_lbs all nullable)
- Timestamp defaults and update triggers
- Drizzle relations for type-safe queries
- Type exports ($inferSelect, $inferInsert)
- Simplified column names: `order` (not order_index), `exercise_id` (not exercise_definition_id)

#### Step 2: Update Database Client (`db/index.ts`)

Import schema and pass to drizzle() for type-safe queries:

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

export { db };
```

#### Step 3: Create Seed Script (`db/seed.ts`)

Populate exercise_definitions with ~15-20 common exercises (simplified list):

- Barbell Squat, Barbell Bench Press, Barbell Deadlift, Barbell Overhead Press, Barbell Row
- Dumbbell Bench Press, Dumbbell Shoulder Press, Dumbbell Row
- Pull-ups, Push-ups, Dips, Bodyweight Squat
- Bicep Curl, Tricep Extension, Lateral Raise, Leg Curl, Leg Extension

Note: No metadata fields - just name and optional description

#### Step 4: Generate and Apply Migration

```bash
npx drizzle-kit generate  # Creates migration SQL
npx drizzle-kit push      # Applies to Neon database
```

#### Step 5: Run Seed Script

```bash
npx tsx db/seed.ts        # Populate exercise catalog
```

#### Step 6: Create Type Definitions (`lib/types/workout.ts`)

Re-export schema types and define complex relation types:

- WorkoutWithExercises (full nested structure)
- Individual table types from schema

#### Step 7: Add Package.json Scripts

```json
"db:generate": "drizzle-kit generate"
"db:push": "drizzle-kit push"
"db:studio": "drizzle-kit studio"
"db:seed": "tsx db/seed.ts"
```

### Key Design Decisions

1. **Simplified schema** - Removed notes, RPE, metadata fields - focus on core tracking
2. **Identity columns** over serial (PostgreSQL 10+ best practice)
3. **Nullable weight** supports bodyweight exercises per requirements
4. **Timestamp-based duration** - started_at/completed_at instead of storing duration
5. **Simple column names** - `order` instead of `order_index`, `exercise_id` instead of `exercise_definition_id`
6. **Cascade deletes** on dependent tables (workout → exercises → sets)
7. **Restrict delete** on exercise_definitions prevents deleting catalog items in use
8. **Shared exercise catalog** across all users (no user_id on definitions)
9. **Weight in lbs** as decimal(6,2) - handles up to 9999.99 lbs with precision
10. **Unique constraints** prevent duplicate ordering within same workout/exercise
11. **No redundant date field** - date derived from started_at timestamp

### Query Patterns Supported

- Get user's recent workouts with full details
- Create complete workout with exercises and sets
- Track exercise history across workouts
- Efficient pagination by started_at timestamp
- Calculate workout duration from (completed_at - started_at)
- Filter exercises by name search

### Future Extensibility

- Can add notes fields to workouts/exercises/sets if needed
- Can add RPE/RIR tracking via new column on exercise_sets
- Can add rest time, tempo, failure flags via new columns
- Can add exercise metadata (muscle group, equipment) if filtering becomes important
- Can add user-specific exercise definitions via separate table
- Can add workout templates via new table referencing definitions
- Weight unit preference (lbs/kg) via app-level user settings

---

## Part 2: Detailed Table Schemas

### Table 1: exercise_definitions

| Column | Type | Constraints |
| -------- | ------ | ------------- |
| id | integer | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY |
| name | varchar(255) | NOT NULL, UNIQUE |
| description | text | nullable |
| is_active | boolean | NOT NULL, DEFAULT true |
| created_at | timestamp | NOT NULL, DEFAULT now() |
| updated_at | timestamp | NOT NULL, DEFAULT now(), auto-update |

### Table 2: workouts

| Column | Type | Constraints |
| -------- | ------ | ------------- |
| id | integer | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY |
| user_id | varchar(255) | NOT NULL |
| name | varchar(255) | NOT NULL |
| started_at | timestamp | nullable |
| completed_at | timestamp | nullable |
| created_at | timestamp | NOT NULL, DEFAULT now() |
| updated_at | timestamp | NOT NULL, DEFAULT now(), auto-update |

**Indexes**: user_id, started_at, (user_id, started_at)

### Table 3: workout_exercises

| Column | Type | Constraints |
| -------- | ------ | ------------- |
| id | integer | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY |
| workout_id | integer | NOT NULL, FK → workouts.id (CASCADE) |
| exercise_id | integer | NOT NULL, FK → exercise_definitions.id (RESTRICT) |
| order | integer | NOT NULL |
| created_at | timestamp | NOT NULL, DEFAULT now() |

**Unique**: (workout_id, order)

### Table 4: exercise_sets

| Column | Type | Constraints |
| -------- | ------ | ------------- |
| id | integer | PRIMARY KEY, GENERATED ALWAYS AS IDENTITY |
| workout_exercise_id | integer | NOT NULL, FK → workout_exercises.id (CASCADE) |
| order | integer | NOT NULL |
| reps | integer | NOT NULL |
| weight_lbs | numeric(6,2) | nullable |
| created_at | timestamp | NOT NULL, DEFAULT now() |

**Unique**: (workout_exercise_id, order)

---

## Part 3: Implementation Summary

### Files Created/Modified

#### 1. `db/schema.ts` (Created)

Complete schema with 4 normalized tables:

- `exercise_definitions` - Shared exercise catalog
- `workouts` - User workout sessions with started_at/completed_at
- `workout_exercises` - Junction table with order field
- `exercise_sets` - Individual sets with nullable weight_lbs

Includes:

- Identity columns for all primary keys
- Foreign key constraints with cascade/restrict rules
- Drizzle relations for type-safe queries
- TypeScript type exports ($inferSelect, $inferInsert)
- Complex type for nested queries (WorkoutWithExercises)

#### 2. `db/index.ts` (Modified)

Updated to properly initialize Neon client and import schema:

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

export { db };
```

#### 3. `db/seed.ts` (Created)

Seed script that populates 17 common exercises:

- 5 Barbell exercises (Squat, Bench Press, Deadlift, Overhead Press, Row)
- 3 Dumbbell exercises (Bench Press, Shoulder Press, Row)
- 4 Bodyweight exercises (Pull-ups, Push-ups, Dips, Bodyweight Squat)
- 5 Isolation exercises (Bicep Curl, Tricep Extension, Lateral Raise, Leg Curl, Leg Extension)

#### 4. `lib/types/workout.ts` (Created)

Type definitions for convenient importing:

- Re-exports all schema types
- Provides type-safe interfaces for application use

#### 5. `package.json` (Modified)

Added database management scripts:

```json
"db:generate": "drizzle-kit generate",
"db:push": "drizzle-kit push",
"db:studio": "drizzle-kit studio",
"db:seed": "tsx db/seed.ts"
```

### Database Deployment Status

✅ **Schema Deployed**: All 4 tables created in Neon PostgreSQL database
✅ **Exercises Seeded**: 17 common exercises successfullyy inserted
✅ **Foreign Keys**: All constraints enforced at database level
✅ **Indexes Created**: Optimized for common query patterns
✅ **Type Safety**: Full TypeScript inference from schema

### Database Features

#### Core Functionality

- **Normalized Design**: No data duplication, efficient storage
- **Simplified Fields**: Focus on core workout data only
- **Timestamp Tracking**: started_at/completed_at for flexible duration calculation
- **Bodyweight Support**: Nullable weight_lbs field for exercises like pull-ups
- **Ordering Support**: Maintains exercise and set sequence within workouts

#### Data Integrity

- **Cascade Deletes**: Deleting a workout removes all related exercises and sets
- **Restrict Deletes**: Cannot delete exercise definitions that are in use
- **Unique Constraints**: Prevents duplicate ordering values
- **Soft Deletes**: Exercise definitions use is_active flag

#### Type Safety

- **Inferred Types**: TypeScript types automatically generated from schema
- **Relation Types**: Type-safe nested queries with full autocompletion
- **Insert Types**: Separate types for creating new records (handles defaults)

### Available Commands

```bash
# Database Management
npm run db:push      # Push schema changes to Neon database
npm run db:generate  # Generate migration files
npm run db:studio    # Open Drizzle Studio (visual database browser)
npm run db:seed      # Seed exercise catalog

# Development
npm run dev          # Start Next.js development server
npm run build        # Build for production
```

### Example Usage

#### Query Workout with Full Details

```typescript
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq } from "drizzle-orm";

const workout = await db.query.workouts.findFirst({
  where: eq(workouts.id, workoutId),
  with: {
    workoutExercises: {
      orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.order)],
      with: {
        exerciseDefinition: true,
        sets: {
          orderBy: (sets, { asc }) => [asc(sets.order)]
        }
      }
    }
  }
});
```

#### Create a Workout

```typescript
import { db } from "@/db";
import { workouts, workoutExercises, exerciseSets } from "@/db/schema";

// 1. Create workout
const [workout] = await db.insert(workouts).values({
  userId: "user_xxx",
  name: "Push Day",
  startedAt: new Date(),
}).returning();

// 2. Add exercise to workout
const [exercise] = await db.insert(workoutExercises).values({
  workoutId: workout.id,
  exerciseId: 2, // Barbell Bench Press
  order: 0
}).returning();

// 3. Add sets
await db.insert(exerciseSets).values([
  { workoutExerciseId: exercise.id, order: 0, reps: 8, weightLbs: "225.00" },
  { workoutExerciseId: exercise.id, order: 1, reps: 6, weightLbs: "235.00" },
  { workoutExerciseId: exercise.id, order: 2, reps: 4, weightLbs: "245.00" },
]);
```

#### Calculate Workout Duration

```typescript
const duration = workout.completedAt && workout.startedAt
  ? Math.round((workout.completedAt.getTime() - workout.startedAt.getTime()) / 60000)
  : null;

console.log(`Workout duration: ${duration} minutes`);
```

### Success Criteria (All Met)

✅ Schema deployed to Neon database
✅ Exercise catalog seeded with common exercises
✅ TypeScript types fully inferred from schema
✅ No data duplication (normalized design)
✅ Foreign key constraints enforced
✅ Simplified design with core fields only
✅ Ready for server actions/API routes to use

### Next Steps

The database schema is now complete and ready for application development. Consider:

1. **Server Actions**: Create server actions for CRUD operations
2. **API Routes**: Build RESTful endpoints if needed for external clients
3. **UI Components**: Design workout logging interface
4. **Authentication**: Integrate Clerk userId in all workout operations
5. **Validation**: Add Zod schemas for form validation
6. **Testing**: Write tests for database operations

### Notes

- All timestamps are stored in UTC
- Weight is stored in pounds (lbs) with 2 decimal precision
- Exercise catalog is shared across all users
- Workouts are user-specific (isolated by userId)
- Duration is calculated, not stored (avoid data redundancy)
- Schema supports bodyweight exercises (nullable weight)

---

**Document Version**: 1.0
**Last Updated**: 2025-12-22
**Schema Version**: Initial Release
