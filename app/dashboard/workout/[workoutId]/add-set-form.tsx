"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { addSetAction } from "./actions";
import { Plus } from "lucide-react";
import type { ExerciseSet } from "@/db/schema";

interface AddSetFormProps {
  workoutId: number;
  workoutExerciseId: number;
  previousSet?: ExerciseSet;
  nextSetNumber: number;
}

export function AddSetForm({
  workoutId,
  workoutExerciseId,
  previousSet,
  nextSetNumber,
}: AddSetFormProps) {
  // Start with blank inputs for user to fill in
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
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
        // Clear the form after successful submission
        setReps("");
        setWeight("");
      }
    });
  };

  return (
    <>
      <TableRow>
        <TableCell className="text-center font-medium text-muted-foreground">
          {nextSetNumber}
        </TableCell>
        <TableCell className="text-center">
          <Input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            disabled={isPending}
            min={1}
            max={999}
            className="text-center h-8"
            required
          />
        </TableCell>
        <TableCell className="text-center">
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            disabled={isPending}
            min={0}
            max={9999}
            step={2.5}
            className="text-center h-8"
          />
        </TableCell>
        <TableCell className="text-right">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            size="sm"
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Set
          </Button>
        </TableCell>
      </TableRow>
      {error && (
        <TableRow>
          <TableCell colSpan={4} className="text-center py-2">
            <span className="text-xs text-red-600">{error}</span>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
