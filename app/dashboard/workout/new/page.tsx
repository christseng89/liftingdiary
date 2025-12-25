import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CreateWorkoutForm } from "./create-workout-form";

interface NewWorkoutPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function NewWorkoutPage({
  searchParams,
}: NewWorkoutPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get the selected date from URL params (from dashboard)
  const params = await searchParams;
  const selectedDate = params.date ? new Date(params.date) : new Date();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <CreateWorkoutForm selectedDate={selectedDate} />
    </div>
  );
}
