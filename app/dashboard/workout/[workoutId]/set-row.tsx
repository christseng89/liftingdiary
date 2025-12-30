"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateSetAction, deleteSetAction } from "./actions";
import { Trash2 } from "lucide-react";
import type { ExerciseSet } from "@/db/schema";

interface SetRowProps {
  set: ExerciseSet;
  workoutId: number;
  setNumber: number;
}

export function SetRow({ set, workoutId, setNumber }: SetRowProps) {
  const [reps, setReps] = useState(set.reps.toString());
  const [weight, setWeight] = useState(
    set.weightLbs ? parseFloat(set.weightLbs).toString() : ""
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = () => {
    if (!reps || parseInt(reps) < 1) return;

    setError(null);
    startTransition(async () => {
      const result = await updateSetAction({
        workoutId,
        setId: set.id,
        reps: parseInt(reps, 10),
        weightLbs: weight ? parseFloat(weight) : undefined,
      });

      if (!result.success) {
        setError(result.error);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this set?")) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteSetAction({
        workoutId,
        setId: set.id,
      });

      if (!result.success) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-2 py-2">
      {/* Set Number */}
      <span className="text-sm font-medium w-8 text-muted-foreground">
        #{setNumber}
      </span>

      {/* Reps Input */}
      <div className="flex-1">
        <Input
          type="number"
          placeholder="Reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onBlur={handleUpdate}
          disabled={isPending}
          min={1}
          max={999}
          className="text-center"
        />
      </div>

      {/* Weight Input */}
      <div className="flex-1">
        <Input
          type="number"
          placeholder="Weight (lbs)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={handleUpdate}
          disabled={isPending}
          min={0}
          max={9999}
          step={2.5}
          className="text-center"
        />
      </div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={isPending}
        className="shrink-0"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>

      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
