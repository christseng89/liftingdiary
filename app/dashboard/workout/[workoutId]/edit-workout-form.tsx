"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateWorkoutAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { z } from "zod";

interface EditWorkoutFormProps {
  workout: {
    id: number;
    name: string;
    startedAt: Date | null;
    completedAt: Date | null;
    notes: string | null;
  };
  redirectDate?: string;
}

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

export function EditWorkoutForm({ workout, redirectDate }: EditWorkoutFormProps) {
  const router = useRouter();

  // Format date for datetime-local input (YYYY-MM-DDTHH:MM)
  const formatDateTimeLocal = (date: Date | null) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper function to get field-specific error
  const getFieldError = (fieldName: string) => {
    if (!state || state.success || !state.issues) return null;
    const issue = state.issues.find((issue) =>
      issue.path.includes(fieldName)
    );
    return issue?.message;
  };

  const defaultStartedAt = formatDateTimeLocal(workout.startedAt);
  // Default completedAt to startedAt if not set
  const defaultCompletedAt = formatDateTimeLocal(
    workout.completedAt || workout.startedAt
  );

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState: ActionState, formData: FormData): Promise<ActionState> => {
      const name = formData.get("name") as string;
      const startedAtValue = formData.get("startedAt") as string;
      const completedAtValue = formData.get("completedAt") as string;
      const notes = formData.get("notes") as string;
      const redirectDateValue = formData.get("redirectDate") as string;

      const input = {
        workoutId: workout.id,
        name: name.trim(),
        startedAt: startedAtValue ? new Date(startedAtValue) : undefined,
        completedAt: completedAtValue ? new Date(completedAtValue) : undefined,
        notes: notes.trim() || undefined,
        redirectDate: redirectDateValue,
      };

      // Call Server Action - returns either success with redirect URL or error state
      return await updateWorkoutAction(input);
    },
    null
  );

  // Handle client-side redirect on success
  useEffect(() => {
    if (state?.success) {
      router.push(state.redirectUrl);
    }
  }, [state, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Workout</CardTitle>
        <CardDescription>Update workout details</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Workout Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Morning Push Day"
              defaultValue={workout.name}
              required
              disabled={isPending}
              className={getFieldError("name") ? "border-red-500" : ""}
            />
            {getFieldError("name") && (
              <p className="text-sm text-red-600">{getFieldError("name")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startedAt">Started At</Label>
            <Input
              id="startedAt"
              name="startedAt"
              type="datetime-local"
              defaultValue={defaultStartedAt}
              disabled={isPending}
              className={getFieldError("startedAt") ? "border-red-500" : ""}
            />
            {getFieldError("startedAt") && (
              <p className="text-sm text-red-600">
                {getFieldError("startedAt")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="completedAt">Completed At</Label>
            <Input
              id="completedAt"
              name="completedAt"
              type="datetime-local"
              defaultValue={defaultCompletedAt}
              disabled={isPending}
              className={getFieldError("completedAt") ? "border-red-500" : ""}
            />
            {getFieldError("completedAt") ? (
              <p className="text-sm text-red-600">
                {getFieldError("completedAt")}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Defaults to Started At date. Must be after Started At.
              </p>
            )}
          </div>

          {/* Hidden input to pass redirect date */}
          {redirectDate && (
            <input type="hidden" name="redirectDate" value={redirectDate} />
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Add any notes about this workout..."
              defaultValue={workout.notes || ""}
              disabled={isPending}
              rows={4}
              className={getFieldError("notes") ? "border-red-500" : ""}
            />
            {getFieldError("notes") && (
              <p className="text-sm text-red-600">{getFieldError("notes")}</p>
            )}
          </div>

          {state && !state.success && state.error && !state.issues && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              {state.error}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update Workout"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
