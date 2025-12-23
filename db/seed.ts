import "dotenv/config";
import { db } from "./index";
import {
  exerciseDefinitions,
  workouts,
  workoutExercises,
  exerciseSets,
} from "./schema";

const commonExercises = [
  // Barbell exercises
  { name: "Barbell Squat", description: "Compound leg exercise with barbell" },
  {
    name: "Barbell Bench Press",
    description: "Compound chest exercise with barbell",
  },
  {
    name: "Barbell Deadlift",
    description: "Compound full-body exercise with barbell",
  },
  {
    name: "Barbell Overhead Press",
    description: "Compound shoulder exercise with barbell",
  },
  { name: "Barbell Row", description: "Compound back exercise with barbell" },

  // Dumbbell exercises
  {
    name: "Dumbbell Bench Press",
    description: "Compound chest exercise with dumbbells",
  },
  {
    name: "Dumbbell Shoulder Press",
    description: "Compound shoulder exercise with dumbbells",
  },
  {
    name: "Dumbbell Row",
    description: "Compound back exercise with dumbbells",
  },

  // Bodyweight exercises
  { name: "Pull-ups", description: "Compound back exercise using bodyweight" },
  { name: "Push-ups", description: "Compound chest exercise using bodyweight" },
  {
    name: "Dips",
    description: "Compound chest and tricep exercise using bodyweight",
  },
  {
    name: "Bodyweight Squat",
    description: "Compound leg exercise using bodyweight",
  },

  // Isolation exercises
  {
    name: "Bicep Curl",
    description: "Isolation arm exercise targeting biceps",
  },
  {
    name: "Tricep Extension",
    description: "Isolation arm exercise targeting triceps",
  },
  {
    name: "Lateral Raise",
    description: "Isolation shoulder exercise targeting side delts",
  },
  {
    name: "Leg Curl",
    description: "Isolation leg exercise targeting hamstrings",
  },
  {
    name: "Leg Extension",
    description: "Isolation leg exercise targeting quadriceps",
  },
];

async function seed() {
  try {
    console.log("🌱 Seeding database...");

    // 1. Seed exercise definitions
    console.log("📝 Inserting exercise definitions...");
    await db.insert(exerciseDefinitions).values(commonExercises);
    console.log(`✅ Seeded ${commonExercises.length} exercises`);

    // 2. Seed sample workouts for a demo user
    console.log("📝 Inserting sample workouts...");
    const sampleWorkouts = await db
      .insert(workouts)
      .values([
        {
          userId: "user_378pkx01EpUKOTsNEPngV0twzUa",
          name: "Push Day - Upper Body",
          startedAt: new Date("2025-12-20T10:00:00Z"),
          completedAt: new Date("2025-12-20T11:30:00Z"),
        },
        {
          userId: "user_378pkx01EpUKOTsNEPngV0twzUa",
          name: "Leg Day",
          startedAt: new Date("2025-12-21T14:00:00Z"),
          completedAt: new Date("2025-12-21T15:45:00Z"),
        },
        {
          userId: "user_378pkx01EpUKOTsNEPngV0twzUa",
          name: "Pull Day - Back & Biceps",
          startedAt: new Date("2025-12-22T09:00:00Z"),
          completedAt: new Date("2025-12-22T10:15:00Z"),
        },
      ])
      .returning();
    console.log(`✅ Seeded ${sampleWorkouts.length} workouts`);

    // 3. Seed workout exercises (linking exercises to workouts)
    console.log("📝 Inserting workout exercises...");

    // Push Day exercises
    const pushDayExercises = await db
      .insert(workoutExercises)
      .values([
        { workoutId: sampleWorkouts[0].id, exerciseId: 2, order: 0 }, // Barbell Bench Press
        { workoutId: sampleWorkouts[0].id, exerciseId: 4, order: 1 }, // Barbell Overhead Press
        { workoutId: sampleWorkouts[0].id, exerciseId: 11, order: 2 }, // Dips
        { workoutId: sampleWorkouts[0].id, exerciseId: 14, order: 3 }, // Tricep Extension
      ])
      .returning();

    // Leg Day exercises
    const legDayExercises = await db
      .insert(workoutExercises)
      .values([
        { workoutId: sampleWorkouts[1].id, exerciseId: 1, order: 0 }, // Barbell Squat
        { workoutId: sampleWorkouts[1].id, exerciseId: 3, order: 1 }, // Barbell Deadlift
        { workoutId: sampleWorkouts[1].id, exerciseId: 16, order: 2 }, // Leg Curl
        { workoutId: sampleWorkouts[1].id, exerciseId: 17, order: 3 }, // Leg Extension
      ])
      .returning();

    // Pull Day exercises
    const pullDayExercises = await db
      .insert(workoutExercises)
      .values([
        { workoutId: sampleWorkouts[2].id, exerciseId: 5, order: 0 }, // Barbell Row
        { workoutId: sampleWorkouts[2].id, exerciseId: 9, order: 1 }, // Pull-ups
        { workoutId: sampleWorkouts[2].id, exerciseId: 8, order: 2 }, // Dumbbell Row
        { workoutId: sampleWorkouts[2].id, exerciseId: 13, order: 3 }, // Bicep Curl
      ])
      .returning();

    const allWorkoutExercises = [
      ...pushDayExercises,
      ...legDayExercises,
      ...pullDayExercises,
    ];
    console.log(`✅ Seeded ${allWorkoutExercises.length} workout exercises`);

    // 4. Seed exercise sets
    console.log("📝 Inserting exercise sets...");

    // Sets for Push Day
    await db.insert(exerciseSets).values([
      // Barbell Bench Press (3 sets)
      {
        workoutExerciseId: pushDayExercises[0].id,
        order: 0,
        reps: 8,
        weightLbs: "225.00",
      },
      {
        workoutExerciseId: pushDayExercises[0].id,
        order: 1,
        reps: 6,
        weightLbs: "235.00",
      },
      {
        workoutExerciseId: pushDayExercises[0].id,
        order: 2,
        reps: 4,
        weightLbs: "245.00",
      },

      // Barbell Overhead Press (3 sets)
      {
        workoutExerciseId: pushDayExercises[1].id,
        order: 0,
        reps: 8,
        weightLbs: "135.00",
      },
      {
        workoutExerciseId: pushDayExercises[1].id,
        order: 1,
        reps: 6,
        weightLbs: "145.00",
      },
      {
        workoutExerciseId: pushDayExercises[1].id,
        order: 2,
        reps: 5,
        weightLbs: "155.00",
      },

      // Dips (3 sets - bodyweight, no weight)
      {
        workoutExerciseId: pushDayExercises[2].id,
        order: 0,
        reps: 12,
        weightLbs: null,
      },
      {
        workoutExerciseId: pushDayExercises[2].id,
        order: 1,
        reps: 10,
        weightLbs: null,
      },
      {
        workoutExerciseId: pushDayExercises[2].id,
        order: 2,
        reps: 8,
        weightLbs: null,
      },

      // Tricep Extension (3 sets)
      {
        workoutExerciseId: pushDayExercises[3].id,
        order: 0,
        reps: 12,
        weightLbs: "30.00",
      },
      {
        workoutExerciseId: pushDayExercises[3].id,
        order: 1,
        reps: 10,
        weightLbs: "35.00",
      },
      {
        workoutExerciseId: pushDayExercises[3].id,
        order: 2,
        reps: 8,
        weightLbs: "40.00",
      },
    ]);

    // Sets for Leg Day
    await db.insert(exerciseSets).values([
      // Barbell Squat (4 sets)
      {
        workoutExerciseId: legDayExercises[0].id,
        order: 0,
        reps: 10,
        weightLbs: "275.00",
      },
      {
        workoutExerciseId: legDayExercises[0].id,
        order: 1,
        reps: 8,
        weightLbs: "295.00",
      },
      {
        workoutExerciseId: legDayExercises[0].id,
        order: 2,
        reps: 6,
        weightLbs: "315.00",
      },
      {
        workoutExerciseId: legDayExercises[0].id,
        order: 3,
        reps: 4,
        weightLbs: "335.00",
      },

      // Barbell Deadlift (3 sets)
      {
        workoutExerciseId: legDayExercises[1].id,
        order: 0,
        reps: 8,
        weightLbs: "315.00",
      },
      {
        workoutExerciseId: legDayExercises[1].id,
        order: 1,
        reps: 5,
        weightLbs: "365.00",
      },
      {
        workoutExerciseId: legDayExercises[1].id,
        order: 2,
        reps: 3,
        weightLbs: "405.00",
      },

      // Leg Curl (3 sets)
      {
        workoutExerciseId: legDayExercises[2].id,
        order: 0,
        reps: 12,
        weightLbs: "90.00",
      },
      {
        workoutExerciseId: legDayExercises[2].id,
        order: 1,
        reps: 10,
        weightLbs: "100.00",
      },
      {
        workoutExerciseId: legDayExercises[2].id,
        order: 2,
        reps: 8,
        weightLbs: "110.00",
      },

      // Leg Extension (3 sets)
      {
        workoutExerciseId: legDayExercises[3].id,
        order: 0,
        reps: 12,
        weightLbs: "100.00",
      },
      {
        workoutExerciseId: legDayExercises[3].id,
        order: 1,
        reps: 10,
        weightLbs: "110.00",
      },
      {
        workoutExerciseId: legDayExercises[3].id,
        order: 2,
        reps: 8,
        weightLbs: "120.00",
      },
    ]);

    // Sets for Pull Day
    await db.insert(exerciseSets).values([
      // Barbell Row (3 sets)
      {
        workoutExerciseId: pullDayExercises[0].id,
        order: 0,
        reps: 10,
        weightLbs: "185.00",
      },
      {
        workoutExerciseId: pullDayExercises[0].id,
        order: 1,
        reps: 8,
        weightLbs: "205.00",
      },
      {
        workoutExerciseId: pullDayExercises[0].id,
        order: 2,
        reps: 6,
        weightLbs: "225.00",
      },

      // Pull-ups (3 sets - bodyweight)
      {
        workoutExerciseId: pullDayExercises[1].id,
        order: 0,
        reps: 10,
        weightLbs: null,
      },
      {
        workoutExerciseId: pullDayExercises[1].id,
        order: 1,
        reps: 8,
        weightLbs: null,
      },
      {
        workoutExerciseId: pullDayExercises[1].id,
        order: 2,
        reps: 6,
        weightLbs: null,
      },

      // Dumbbell Row (3 sets per arm)
      {
        workoutExerciseId: pullDayExercises[2].id,
        order: 0,
        reps: 12,
        weightLbs: "75.00",
      },
      {
        workoutExerciseId: pullDayExercises[2].id,
        order: 1,
        reps: 10,
        weightLbs: "85.00",
      },
      {
        workoutExerciseId: pullDayExercises[2].id,
        order: 2,
        reps: 8,
        weightLbs: "95.00",
      },

      // Bicep Curl (3 sets)
      {
        workoutExerciseId: pullDayExercises[3].id,
        order: 0,
        reps: 12,
        weightLbs: "35.00",
      },
      {
        workoutExerciseId: pullDayExercises[3].id,
        order: 1,
        reps: 10,
        weightLbs: "40.00",
      },
      {
        workoutExerciseId: pullDayExercises[3].id,
        order: 2,
        reps: 8,
        weightLbs: "45.00",
      },
    ]);

    const totalSets = 12 + 13 + 12; // Push Day: 12, Leg Day: 13, Pull Day: 12
    console.log(`✅ Seeded ${totalSets} exercise sets`);

    console.log("\n🎉 Database seeding completed successfullyy!");
    console.log("📊 Summary:");
    console.log(`   - ${commonExercises.length} exercise definitions`);
    console.log(`   - ${sampleWorkouts.length} workouts`);
    console.log(`   - ${allWorkoutExercises.length} workout exercises`);
    console.log(`   - ${totalSets} exercise sets`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
