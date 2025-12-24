"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Mock workout data for UI demonstration
const mockWorkouts = [
  {
    id: 1,
    name: "Upper Body Strength",
    exercises: ["Bench Press", "Pull-ups", "Shoulder Press"],
    duration: "45 min",
    notes: "Felt strong today, increased weight on bench press",
  },
  {
    id: 2,
    name: "Cardio Session",
    exercises: ["Running", "Jump Rope"],
    duration: "30 min",
    notes: "Good endurance workout",
  },
  {
    id: 3,
    name: "Lower Body Power",
    exercises: ["Squats", "Deadlifts", "Leg Press"],
    duration: "60 min",
    notes: "New PR on squats!",
  },
];

export default function DashboardPage() {
  const [date, setDate] = useState<Date>(new Date());

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header with Datepicker */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Workout Dashboard</h1>

        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[280px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "do MMM yyyy") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Workout List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">
            Workouts for {format(date, "do MMM yyyy")}
          </h2>
          <span className="text-sm text-muted-foreground">
            {mockWorkouts.length} {mockWorkouts.length === 1 ? "workout" : "workouts"}
          </span>
        </div>

        {mockWorkouts.length > 0 ? (
          <div className="grid gap-4">
            {mockWorkouts.map((workout) => (
              <Card key={workout.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>{workout.name}</CardTitle>
                  <CardDescription>{workout.duration}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Exercises:</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {workout.exercises.map((exercise, index) => (
                          <li key={index}>{exercise}</li>
                        ))}
                      </ul>
                    </div>
                    {workout.notes && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Notes:</h4>
                        <p className="text-sm text-muted-foreground">{workout.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
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
