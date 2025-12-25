"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createWorkoutAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";

interface CreateWorkoutFormProps {
  selectedDate: Date;
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

export function CreateWorkoutForm({ selectedDate }: CreateWorkoutFormProps) {
  const router = useRouter();

  // Format the selected date with current time for datetime-local input
  // datetime-local expects format: YYYY-MM-DDTHH:MM
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(new Date().getHours()).padStart(2, '0');
    const minutes = String(new Date().getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const defaultDateTime = formatDateTimeLocal(selectedDate);
  const redirectDate = selectedDate.toISOString();

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState: ActionState, formData: FormData): Promise<ActionState> => {
      const name = formData.get("name") as string;
      const startedAtValue = formData.get("startedAt") as string;
      const notes = formData.get("notes") as string;
      const redirectDateValue = formData.get("redirectDate") as string;

      const input = {
        name: name.trim(),
        startedAt: startedAtValue ? new Date(startedAtValue) : undefined,
        notes: notes.trim() || undefined,
        redirectDate: redirectDateValue,
      };

      // Call Server Action - returns either success with redirect URL or error state
      return await createWorkoutAction(input);
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
        <CardTitle>Create New Workout</CardTitle>
        <CardDescription>Add a new workout to your diary</CardDescription>
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
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startedAt">Started At</Label>
            <Input
              id="startedAt"
              name="startedAt"
              type="datetime-local"
              defaultValue={defaultDateTime}
              disabled={isPending}
            />
            <p className="text-sm text-muted-foreground">
              Defaults to selected date with current time
            </p>
          </div>

          {/* Hidden input to pass redirect date */}
          <input type="hidden" name="redirectDate" value={redirectDate} />

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Add any notes about this workout..."
              disabled={isPending}
              rows={4}
            />
          </div>

          {state && !state.success && state.error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              {state.error}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Workout"}
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
