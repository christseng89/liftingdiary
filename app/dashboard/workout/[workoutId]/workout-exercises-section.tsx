"use client";

import { Card } from "@/components/ui/card";
import { AddExerciseButton } from "./add-exercise-button";
import { ExerciseCard } from "./exercise-card";
import type {
  WorkoutWithExercises,
  ExerciseDefinition,
} from "@/db/schema";

interface WorkoutExercisesSectionProps {
  workout: WorkoutWithExercises;
  exerciseDefinitions: ExerciseDefinition[];
}

export function WorkoutExercisesSection({
  workout,
  exerciseDefinitions,
}: WorkoutExercisesSectionProps) {
  const hasExercises = workout.workoutExercises.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Exercises</h2>
      </div>

      {!hasExercises ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">
            No exercises added yet. Start building your workout!
          </p>
          <AddExerciseButton
            workoutId={workout.id}
            exerciseDefinitions={exerciseDefinitions}
          />
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {workout.workoutExercises.map((workoutExercise, index) => (
              <ExerciseCard
                key={workoutExercise.id}
                workoutExercise={workoutExercise}
                workoutId={workout.id}
                exerciseNumber={index + 1}
              />
            ))}
          </div>

          <AddExerciseButton
            workoutId={workout.id}
            exerciseDefinitions={exerciseDefinitions}
          />
        </>
      )}
    </div>
  );
}
