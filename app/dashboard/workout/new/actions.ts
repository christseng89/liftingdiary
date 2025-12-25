"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createWorkout } from "@/data/workouts";

const createWorkoutSchema = z.object({
  name: z.string().min(1, "Workout name is required").max(255, "Name too long"),
  startedAt: z.date().optional(),
  notes: z.string().max(1000, "Notes too long").optional(),
  redirectDate: z.string().optional(),
});

export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

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

export async function createWorkoutAction(input: CreateWorkoutInput): Promise<ActionResult> {
  let redirectUrl = "/dashboard";

  try {
    const validated = createWorkoutSchema.parse(input);

    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Extract redirectDate before passing to createWorkout
    const { redirectDate, ...workoutData } = validated;

    await createWorkout(workoutData, userId);

    // Build redirect URL with date parameter if provided
    if (redirectDate) {
      redirectUrl = `/dashboard?date=${redirectDate}`;
    }

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

    console.error("Failed to create workout:", error);
    return {
      success: false,
      error: "Failed to create workout. Please try again.",
    };
  }
}
