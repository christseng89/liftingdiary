import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";

/**
 * Fetches workouts for a specific user on a specific date.
 * Only returns workouts where startedAt falls on the specified date.
 *
 * @param userId - The authenticated user's ID from Clerk
 * @param date - The date to fetch workouts for
 * @returns Array of workouts with nested exercises, exercise definitions, and sets
 */
export async function getWorkoutsByUserIdAndDate(
  userId: string,
  date: Date
) {
  // Create start and end of day boundaries for the selected date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch workouts with all related data using Drizzle relational queries
  const results = await db.query.workouts.findMany({
    where: (workouts, { eq, and, gte, lt }) =>
      and(
        eq(workouts.userId, userId), // Security: only fetch user's own workouts
        gte(workouts.startedAt, startOfDay),
        lt(workouts.startedAt, endOfDay)
      ),
    with: {
      workoutExercises: {
        orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.order)],
        with: {
          exerciseDefinition: true,
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.order)],
          },
        },
      },
    },
    orderBy: (workouts, { desc }) => [desc(workouts.startedAt)],
  });

  return results;
}

/**
 * Fetches a single workout by ID, ensuring it belongs to the specified user.
 *
 * @param workoutId - The workout ID to fetch
 * @param userId - The authenticated user's ID from Clerk
 * @returns The workout with nested data, or null if not found or unauthorized
 */
export async function getWorkoutById(workoutId: number, userId: string) {
  const result = await db.query.workouts.findFirst({
    where: (workouts, { eq, and }) =>
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // Security: verify ownership
      ),
    with: {
      workoutExercises: {
        orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.order)],
        with: {
          exerciseDefinition: true,
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.order)],
          },
        },
      },
    },
  });

  return result || null;
}

/**
 * Fetches all workouts for a specific user (no date filter).
 *
 * @param userId - The authenticated user's ID from Clerk
 * @returns Array of all workouts for the user
 */
export async function getWorkoutsByUserId(userId: string) {
  const results = await db.query.workouts.findMany({
    where: (workouts, { eq }) => eq(workouts.userId, userId),
    with: {
      workoutExercises: {
        orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.order)],
        with: {
          exerciseDefinition: true,
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.order)],
          },
        },
      },
    },
    orderBy: (workouts, { desc }) => [desc(workouts.startedAt)],
  });

  return results;
}
