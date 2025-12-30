"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { updateSetAction, deleteSetAction } from "./actions";
import { Trash2, Pencil, Check, X } from "lucide-react";
import type { ExerciseSet } from "@/db/schema";

interface SetRowProps {
  set: ExerciseSet;
  workoutId: number;
  setNumber: number;
}

export function SetRow({ set, workoutId, setNumber }: SetRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [reps, setReps] = useState(set.reps.toString());
  const [weight, setWeight] = useState(
    set.weightLbs ? parseFloat(set.weightLbs).toString() : ""
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setReps(set.reps.toString());
    setWeight(set.weightLbs ? parseFloat(set.weightLbs).toString() : "");
    setError(null);
  };

  const handleSave = () => {
    if (!reps || parseInt(reps) < 1) {
      setError("Reps must be at least 1");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateSetAction({
        workoutId,
        setId: set.id,
        reps: parseInt(reps, 10),
        weightLbs: weight ? parseFloat(weight) : undefined,
      });

      if (result.success) {
        setIsEditing(false);
      } else {
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
    <>
      <TableRow>
        {/* Set Number */}
        <TableCell className="text-center font-medium">
          {setNumber}
        </TableCell>

        {isEditing ? (
          <>
            {/* Reps Input - Editable */}
            <TableCell className="text-center">
              <Input
                type="number"
                placeholder="Reps"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                disabled={isPending}
                min={1}
                max={999}
                className="text-center h-8"
              />
            </TableCell>

            {/* Weight Input - Editable */}
            <TableCell className="text-center">
              <Input
                type="number"
                placeholder="Weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                disabled={isPending}
                min={0}
                max={9999}
                step={2.5}
                className="text-center h-8"
              />
            </TableCell>

            {/* Save and Cancel Buttons */}
            <TableCell className="text-right">
              <div className="flex gap-1 justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSave}
                  disabled={isPending}
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel}
                  disabled={isPending}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </>
        ) : (
          <>
            {/* Reps Display - Read-only */}
            <TableCell className="text-center">
              {set.reps}
            </TableCell>

            {/* Weight Display - Read-only */}
            <TableCell className="text-center">
              {set.weightLbs ? parseFloat(set.weightLbs) : "—"}
            </TableCell>

            {/* Edit and Delete Buttons */}
            <TableCell className="text-right">
              <div className="flex gap-1 justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEdit}
                  disabled={isPending}
                  className="h-8 w-8"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </>
        )}
      </TableRow>
      {error && (
        <TableRow>
          <TableCell colSpan={4} className="text-center">
            <span className="text-xs text-red-600">{error}</span>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
