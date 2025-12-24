import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { format, differenceInMinutes } from "date-fns";

import { getWorkoutsByUserIdAndDate } from "@/data/workouts";
import { DatePicker } from "@/components/dashboard/date-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DashboardPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  // 1. Authenticate the user
  const { userId } = await auth();

  // 2. Redirect if not authenticated
  if (!userId) {
    redirect("/sign-in");
  }

  // 3. Get the selected date from URL search params, default to today
  const params = await searchParams;
  const selectedDate = params.date ? new Date(params.date) : new Date();

  // 4. Fetch workouts for the authenticated user and selected date
  const workouts = await getWorkoutsByUserIdAndDate(userId, selectedDate);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header with Datepicker */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Workout Dashboard</h1>

        <div className="flex items-center gap-4">
          <DatePicker selectedDate={selectedDate} />
        </div>
      </div>

      {/* Workout List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">
            Workouts for {format(selectedDate, "do MMM yyyy")}
          </h2>
          <span className="text-sm text-muted-foreground">
            {workouts.length} {workouts.length === 1 ? "workout" : "workouts"}
          </span>
        </div>

        {workouts.length > 0 ? (
          <div className="grid gap-4">
            {workouts.map((workout) => {
              // Calculate duration if both startedAt and completedAt exist
              const duration =
                workout.startedAt && workout.completedAt
                  ? differenceInMinutes(workout.completedAt, workout.startedAt)
                  : null;

              return (
                <Card
                  key={workout.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <CardTitle>{workout.name}</CardTitle>
                    <CardDescription>
                      {duration ? `${duration} min` : "Duration not recorded"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {workout.workoutExercises.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">
                            Exercises:
                          </h4>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {workout.workoutExercises.map((we) => (
                              <li key={we.id}>
                                {we.exerciseDefinition.name}
                                {we.sets.length > 0 && (
                                  <span className="ml-2 text-xs">
                                    ({we.sets.length}{" "}
                                    {we.sets.length === 1 ? "set" : "sets"})
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {workout.workoutExercises.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No exercises recorded
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No workouts recorded for this date.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
