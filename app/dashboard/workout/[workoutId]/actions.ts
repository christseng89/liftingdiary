"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateWorkout } from "@/data/workouts";
import {
  addExerciseToWorkout,
  removeExerciseFromWorkout,
} from "@/data/exercises";
import { addSetToExercise, updateSet, deleteSet } from "@/data/sets";

const updateWorkoutSchema = z
  .object({
    workoutId: z.number(),
    name: z.string().min(1, "Workout name is required").max(255, "Name too long"),
    startedAt: z.date().optional(),
    completedAt: z.date().optional(),
    notes: z.string().max(1000, "Notes too long").optional(),
    redirectDate: z.string().optional(),
  })
  .refine(
    (data) => {
      // If both dates are provided, completedAt must be after startedAt
      if (data.startedAt && data.completedAt) {
        return data.completedAt > data.startedAt;
      }
      return true;
    },
    {
      message: "Completed At must be after Started At",
      path: ["completedAt"],
    }
  );

export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;

type ActionResult =
  | {
      success: true;
      redirectUrl: string;
    }
  | {
      success: false;
      error: string;
      issues?: z.ZodIssue[];
    };

export async function updateWorkoutAction(
  input: UpdateWorkoutInput
): Promise<ActionResult> {
  let redirectUrl = "/dashboard";

  try {
    const validated = updateWorkoutSchema.parse(input);

    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Extract workoutId and redirectDate before passing to updateWorkout
    const { workoutId, redirectDate, ...workoutData } = validated;

    const updated = await updateWorkout(workoutId, workoutData, userId);

    // Handle not found/unauthorized
    if (!updated) {
      return {
        success: false,
        error: "Workout not found or unauthorized",
      };
    }

    // Build redirect URL with date parameter if provided
    if (redirectDate) {
      redirectUrl = `/dashboard?date=${redirectDate}`;
    }

    revalidatePath(`/dashboard/workout/${workoutId}`);
    revalidatePath("/dashboard");

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

    console.error("Failed to update workout:", error);
    return {
      success: false,
      error: "Failed to update workout. Please try again.",
    };
  }
}

// ============================================================================
// EXERCISE ACTIONS
// ============================================================================

const addExerciseSchema = z.object({
  workoutId: z.number(),
  exerciseDefinitionId: z.number(),
});

export type AddExerciseInput = z.infer<typeof addExerciseSchema>;

export async function addExerciseAction(
  input: AddExerciseInput
): Promise<ActionResult> {
  try {
    const validated = addExerciseSchema.parse(input);
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const workoutExercise = await addExerciseToWorkout(
      validated.workoutId,
      validated.exerciseDefinitionId,
      userId
    );

    if (!workoutExercise) {
      return {
        success: false,
        error: "Workout not found or unauthorized",
      };
    }

    revalidatePath(`/dashboard/workout/${validated.workoutId}`);
    return {
      success: true,
      redirectUrl: `/dashboard/workout/${validated.workoutId}`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        issues: error.issues,
      };
    }
    console.error("Failed to add exercise:", error);
    return {
      success: false,
      error: "Failed to add exercise. Please try again.",
    };
  }
}

const removeExerciseSchema = z.object({
  workoutId: z.number(),
  workoutExerciseId: z.number(),
});

export type RemoveExerciseInput = z.infer<typeof removeExerciseSchema>;

export async function removeExerciseAction(
  input: RemoveExerciseInput
): Promise<ActionResult> {
  try {
    const validated = removeExerciseSchema.parse(input);
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const deleted = await removeExerciseFromWorkout(
      validated.workoutExerciseId,
      validated.workoutId,
      userId
    );

    if (!deleted) {
      return {
        success: false,
        error: "Exercise not found or unauthorized",
      };
    }

    revalidatePath(`/dashboard/workout/${validated.workoutId}`);
    return {
      success: true,
      redirectUrl: `/dashboard/workout/${validated.workoutId}`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        issues: error.issues,
      };
    }
    console.error("Failed to remove exercise:", error);
    return {
      success: false,
      error: "Failed to remove exercise. Please try again.",
    };
  }
}

// ============================================================================
// SET ACTIONS
// ============================================================================

const addSetSchema = z.object({
  workoutId: z.number(),
  workoutExerciseId: z.number(),
  reps: z.number().int().min(1, "Reps must be at least 1").max(999, "Reps must be less than 1000"),
  weightLbs: z.number().min(0, "Weight cannot be negative").max(9999, "Weight must be less than 10000").optional(),
});

export type AddSetInput = z.infer<typeof addSetSchema>;

export async function addSetAction(
  input: AddSetInput
): Promise<ActionResult> {
  try {
    const validated = addSetSchema.parse(input);
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const set = await addSetToExercise(
      validated.workoutExerciseId,
      validated.workoutId,
      { reps: validated.reps, weightLbs: validated.weightLbs },
      userId
    );

    if (!set) {
      return {
        success: false,
        error: "Exercise not found or unauthorized",
      };
    }

    revalidatePath(`/dashboard/workout/${validated.workoutId}`);
    return {
      success: true,
      redirectUrl: `/dashboard/workout/${validated.workoutId}`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        issues: error.issues,
      };
    }
    console.error("Failed to add set:", error);
    return {
      success: false,
      error: "Failed to add set. Please try again.",
    };
  }
}

const updateSetSchema = z.object({
  workoutId: z.number(),
  setId: z.number(),
  reps: z.number().int().min(1, "Reps must be at least 1").max(999, "Reps must be less than 1000"),
  weightLbs: z.number().min(0, "Weight cannot be negative").max(9999, "Weight must be less than 10000").optional(),
});

export type UpdateSetInput = z.infer<typeof updateSetSchema>;

export async function updateSetAction(
  input: UpdateSetInput
): Promise<ActionResult> {
  try {
    const validated = updateSetSchema.parse(input);
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const { setId, workoutId, ...setData } = validated;
    const set = await updateSet(setId, workoutId, setData, userId);

    if (!set) {
      return {
        success: false,
        error: "Set not found or unauthorized",
      };
    }

    revalidatePath(`/dashboard/workout/${validated.workoutId}`);
    return {
      success: true,
      redirectUrl: `/dashboard/workout/${validated.workoutId}`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        issues: error.issues,
      };
    }
    console.error("Failed to update set:", error);
    return {
      success: false,
      error: "Failed to update set. Please try again.",
    };
  }
}

const deleteSetSchema = z.object({
  workoutId: z.number(),
  setId: z.number(),
});

export type DeleteSetInput = z.infer<typeof deleteSetSchema>;

export async function deleteSetAction(
  input: DeleteSetInput
): Promise<ActionResult> {
  try {
    const validated = deleteSetSchema.parse(input);
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const deleted = await deleteSet(validated.setId, validated.workoutId, userId);

    if (!deleted) {
      return {
        success: false,
        error: "Set not found or unauthorized",
      };
    }

    revalidatePath(`/dashboard/workout/${validated.workoutId}`);
    return {
      success: true,
      redirectUrl: `/dashboard/workout/${validated.workoutId}`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        issues: error.issues,
      };
    }
    console.error("Failed to delete set:", error);
    return {
      success: false,
      error: "Failed to delete set. Please try again.",
    };
  }
}
