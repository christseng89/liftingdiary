import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getWorkoutById } from "@/data/workouts";
import { getAllExerciseDefinitions } from "@/data/exercises";
import { EditWorkoutForm } from "./edit-workout-form";
import { WorkoutExercisesSection } from "./workout-exercises-section";

interface EditWorkoutPageProps {
  params: Promise<{ workoutId: string }>;
  searchParams: Promise<{ date?: string }>;
}

export default async function EditWorkoutPage({
  params,
  searchParams,
}: EditWorkoutPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get the workout ID from params
  const { workoutId } = await params;
  const workoutIdNum = parseInt(workoutId, 10);

  if (isNaN(workoutIdNum)) {
    notFound();
  }

  // Fetch workout with userId verification (security)
  const workout = await getWorkoutById(workoutIdNum, userId);

  if (!workout) {
    notFound();
  }

  // Fetch all exercise definitions for selection
  const exerciseDefinitions = await getAllExerciseDefinitions();

  // Get the redirect date from URL params (optional)
  const { date } = await searchParams;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Workout Metadata Form */}
      <div className="mb-8">
        <EditWorkoutForm workout={workout} redirectDate={date} />
      </div>

      {/* Exercises Section */}
      <WorkoutExercisesSection
        workout={workout}
        exerciseDefinitions={exerciseDefinitions}
      />
    </div>
  );
}
