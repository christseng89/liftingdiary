"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { addExerciseAction } from "./actions";
import type { ExerciseDefinition } from "@/db/schema";
import { PlusCircle } from "lucide-react";

interface AddExerciseButtonProps {
  workoutId: number;
  exerciseDefinitions: ExerciseDefinition[];
}

export function AddExerciseButton({
  workoutId,
  exerciseDefinitions,
}: AddExerciseButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSelectExercise = (exerciseId: number) => {
    setError(null);
    startTransition(async () => {
      const result = await addExerciseAction({
        workoutId,
        exerciseDefinitionId: exerciseId,
      });

      if (!result.success) {
        setError(result.error);
      } else {
        setOpen(false); // Close modal on success
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full">
          <PlusCircle className="mr-2 h-5 w-5" />
          Add Exercise
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Search exercises..." />
          <CommandList>
            <CommandEmpty>No exercises found.</CommandEmpty>
            <CommandGroup>
              {exerciseDefinitions.map((exercise) => (
                <CommandItem
                  key={exercise.id}
                  value={exercise.name}
                  onSelect={() => handleSelectExercise(exercise.id)}
                  disabled={isPending}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{exercise.name}</span>
                    {exercise.description && (
                      <span className="text-sm text-muted-foreground">
                        {exercise.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
