import { db } from "@/db";
import {
  workoutExercises,
  workouts,
  exerciseDefinitions,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Get all active exercise definitions (for search/selection)
 */
export async function getAllExerciseDefinitions() {
  return await db.query.exerciseDefinitions.findMany({
    where: (exerciseDefinitions, { eq }) =>
      eq(exerciseDefinitions.isActive, true),
    orderBy: (exerciseDefinitions, { asc }) => [
      asc(exerciseDefinitions.name),
    ],
  });
}

/**
 * Add an exercise to a workout (security: verify workout ownership)
 */
export async function addExerciseToWorkout(
  workoutId: number,
  exerciseDefinitionId: number,
  userId: string
) {
  // CRITICAL: Verify workout ownership first
  const workout = await db.query.workouts.findFirst({
    where: (workouts, { eq, and }) =>
      and(eq(workouts.id, workoutId), eq(workouts.userId, userId)),
  });

  if (!workout) {
    return null; // Workout not found or unauthorized
  }

  // Get current max order for this workout
  const existingExercises = await db.query.workoutExercises.findMany({
    where: (workoutExercises, { eq }) =>
      eq(workoutExercises.workoutId, workoutId),
    orderBy: (workoutExercises, { desc }) => [desc(workoutExercises.order)],
  });

  const nextOrder =
    existingExercises.length > 0 ? existingExercises[0].order + 1 : 0;

  // Insert the workout exercise
  const [workoutExercise] = await db
    .insert(workoutExercises)
    .values({
      workoutId,
      exerciseId: exerciseDefinitionId,
      order: nextOrder,
    })
    .returning();

  return workoutExercise;
}

/**
 * Remove an exercise from a workout (cascade deletes sets)
 */
export async function removeExerciseFromWorkout(
  workoutExerciseId: number,
  workoutId: number,
  userId: string
): Promise<boolean> {
  // CRITICAL: Verify workout ownership
  const workout = await db.query.workouts.findFirst({
    where: (workouts, { eq, and }) =>
      and(eq(workouts.id, workoutId), eq(workouts.userId, userId)),
  });

  if (!workout) {
    return false;
  }

  // Delete workout exercise (sets cascade automatically)
  const [deleted] = await db
    .delete(workoutExercises)
    .where(
      and(
        eq(workoutExercises.id, workoutExerciseId),
        eq(workoutExercises.workoutId, workoutId)
      )
    )
    .returning({ id: workoutExercises.id });

  return !!deleted;
}
