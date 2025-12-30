import { db } from "@/db";
import { exerciseSets, workoutExercises, workouts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Type definitions for set operations
 */
export type CreateSetData = {
  reps: number;
  weightLbs?: number;
};

export type UpdateSetData = {
  reps?: number;
  weightLbs?: number;
};

/**
 * Add a set to an exercise (security: verify workout ownership via workoutExercise)
 */
export async function addSetToExercise(
  workoutExerciseId: number,
  workoutId: number,
  data: CreateSetData,
  userId: string
) {
  // CRITICAL: Verify workout ownership through workoutExercise
  const workoutExercise = await db.query.workoutExercises.findFirst({
    where: (workoutExercises, { eq, and }) =>
      and(
        eq(workoutExercises.id, workoutExerciseId),
        eq(workoutExercises.workoutId, workoutId)
      ),
    with: {
      workout: true,
    },
  });

  if (!workoutExercise || workoutExercise.workout.userId !== userId) {
    return null; // Not found or unauthorized
  }

  // Get current max order for this exercise
  const existingSets = await db.query.exerciseSets.findMany({
    where: (exerciseSets, { eq }) =>
      eq(exerciseSets.workoutExerciseId, workoutExerciseId),
    orderBy: (exerciseSets, { desc }) => [desc(exerciseSets.order)],
  });

  const nextOrder = existingSets.length > 0 ? existingSets[0].order + 1 : 0;

  // Insert the set
  const [set] = await db
    .insert(exerciseSets)
    .values({
      workoutExerciseId,
      order: nextOrder,
      reps: data.reps,
      weightLbs: data.weightLbs !== undefined ? data.weightLbs.toString() : null,
    })
    .returning();

  return set;
}

/**
 * Update a set (security: verify workout ownership)
 */
export async function updateSet(
  setId: number,
  workoutId: number,
  data: UpdateSetData,
  userId: string
) {
  // CRITICAL: Verify ownership through join chain
  const set = await db.query.exerciseSets.findFirst({
    where: (exerciseSets, { eq }) => eq(exerciseSets.id, setId),
    with: {
      workoutExercise: {
        with: {
          workout: true,
        },
      },
    },
  });

  if (
    !set ||
    set.workoutExercise.workout.id !== workoutId ||
    set.workoutExercise.workout.userId !== userId
  ) {
    return null;
  }

  // Build update object with only provided fields
  const updateData: {
    reps?: number;
    weightLbs?: string | null;
  } = {};

  if (data.reps !== undefined) {
    updateData.reps = data.reps;
  }

  if (data.weightLbs !== undefined) {
    updateData.weightLbs = data.weightLbs.toString();
  }

  // Update the set
  const [updated] = await db
    .update(exerciseSets)
    .set(updateData)
    .where(eq(exerciseSets.id, setId))
    .returning();

  return updated;
}

/**
 * Delete a set (security: verify workout ownership)
 */
export async function deleteSet(
  setId: number,
  workoutId: number,
  userId: string
): Promise<boolean> {
  // CRITICAL: Verify ownership
  const set = await db.query.exerciseSets.findFirst({
    where: (exerciseSets, { eq }) => eq(exerciseSets.id, setId),
    with: {
      workoutExercise: {
        with: {
          workout: true,
        },
      },
    },
  });

  if (
    !set ||
    set.workoutExercise.workout.id !== workoutId ||
    set.workoutExercise.workout.userId !== userId
  ) {
    return false;
  }

  // Delete the set
  const [deleted] = await db
    .delete(exerciseSets)
    .where(eq(exerciseSets.id, setId))
    .returning({ id: exerciseSets.id });

  return !!deleted;
}
