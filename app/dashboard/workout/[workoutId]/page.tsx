import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getWorkoutById } from "@/data/workouts";
import { EditWorkoutForm } from "./edit-workout-form";

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

  // Get the redirect date from URL params (optional)
  const { date } = await searchParams;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <EditWorkoutForm workout={workout} redirectDate={date} />
    </div>
  );
}
