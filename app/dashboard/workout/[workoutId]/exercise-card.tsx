"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SetRow } from "./set-row";
import { AddSetForm } from "./add-set-form";
import { removeExerciseAction } from "./actions";
import { ChevronDown, Trash2 } from "lucide-react";
import type {
  WorkoutExercise,
  ExerciseDefinition,
  ExerciseSet,
} from "@/db/schema";

interface ExerciseCardProps {
  workoutExercise: WorkoutExercise & {
    exerciseDefinition: ExerciseDefinition;
    sets: ExerciseSet[];
  };
  workoutId: number;
  exerciseNumber: number;
}

export function ExerciseCard({
  workoutExercise,
  workoutId,
  exerciseNumber,
}: ExerciseCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleRemove = () => {
    if (
      !confirm(
        `Remove ${workoutExercise.exerciseDefinition.name}? All sets will be deleted.`
      )
    )
      return;

    setError(null);
    startTransition(async () => {
      const result = await removeExerciseAction({
        workoutId,
        workoutExerciseId: workoutExercise.id,
      });

      if (!result.success) {
        setError(result.error);
      }
    });
  };

  const totalSets = workoutExercise.sets.length;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div className="flex items-center gap-3 flex-1">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto hover:bg-transparent">
                <CardTitle className="text-base">
                  {exerciseNumber}. {workoutExercise.exerciseDefinition.name}
                </CardTitle>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>

            <Badge variant="secondary" className="ml-2">
              {totalSets} {totalSets === 1 ? "set" : "sets"}
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Exercise Description */}
            {workoutExercise.exerciseDefinition.description && (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {workoutExercise.exerciseDefinition.description}
                </p>
                <Separator className="mb-4" />
              </>
            )}

            {/* Sets List */}
            {workoutExercise.sets.length > 0 ? (
              <div className="space-y-1 mb-2">
                {workoutExercise.sets.map((set, index) => (
                  <SetRow
                    key={set.id}
                    set={set}
                    workoutId={workoutId}
                    setNumber={index + 1}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic mb-4">
                No sets recorded yet. Add your first set below.
              </p>
            )}

            {/* Add Set Form */}
            <AddSetForm
              workoutId={workoutId}
              workoutExerciseId={workoutExercise.id}
              previousSet={
                workoutExercise.sets[workoutExercise.sets.length - 1]
              }
            />

            {error && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
