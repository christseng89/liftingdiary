"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addSetAction } from "./actions";
import { Plus } from "lucide-react";
import type { ExerciseSet } from "@/db/schema";

interface AddSetFormProps {
  workoutId: number;
  workoutExerciseId: number;
  previousSet?: ExerciseSet;
}

export function AddSetForm({
  workoutId,
  workoutExerciseId,
  previousSet,
}: AddSetFormProps) {
  // Pre-fill with previous set values for convenience
  const [reps, setReps] = useState(
    previousSet ? previousSet.reps.toString() : ""
  );
  const [weight, setWeight] = useState(
    previousSet && previousSet.weightLbs
      ? parseFloat(previousSet.weightLbs).toString()
      : ""
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reps || parseInt(reps) < 1) {
      setError("Reps is required");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await addSetAction({
        workoutId,
        workoutExerciseId,
        reps: parseInt(reps, 10),
        weightLbs: weight ? parseFloat(weight) : undefined,
      });

      if (!result.success) {
        setError(result.error);
      } else {
        // Keep the values for next set (user convenience)
        // Don't clear the form - makes it faster to log multiple similar sets
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            type="number"
            placeholder="Reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            disabled={isPending}
            min={1}
            max={999}
            className="text-center"
            required
          />
        </div>
        <div className="flex-1">
          <Input
            type="number"
            placeholder="Weight (lbs)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            disabled={isPending}
            min={0}
            max={9999}
            step={2.5}
            className="text-center"
          />
        </div>
        <Button type="submit" disabled={isPending} className="shrink-0">
          <Plus className="h-4 w-4 mr-1" />
          Add Set
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
