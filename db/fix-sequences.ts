import "dotenv/config";
import { neon } from "@neondatabase/serverless";

/**
 * Fix identity sequences that are out of sync after migrations.
 * This resets the sequence to the next available ID based on the max ID in the table.
 */
async function fixSequences() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(databaseUrl);

  console.log("Fixing identity sequences...");

  try {
    // Fix workouts table sequence
    const workoutsResult = await sql`
      SELECT setval(
        pg_get_serial_sequence('workouts', 'id'),
        COALESCE((SELECT MAX(id) FROM workouts), 0) + 1,
        false
      ) as new_sequence_value;
    `;
    console.log(
      "✓ Fixed workouts sequence. Next ID will be:",
      workoutsResult[0].new_sequence_value
    );

    // Fix exercises table sequence
    const exercisesResult = await sql`
      SELECT setval(
        pg_get_serial_sequence('exercises', 'id'),
        COALESCE((SELECT MAX(id) FROM exercises), 0) + 1,
        false
      ) as new_sequence_value;
    `;
    console.log(
      "✓ Fixed exercises sequence. Next ID will be:",
      exercisesResult[0].new_sequence_value
    );

    // Fix workout_exercises table sequence
    const workoutExercisesResult = await sql`
      SELECT setval(
        pg_get_serial_sequence('workout_exercises', 'id'),
        COALESCE((SELECT MAX(id) FROM workout_exercises), 0) + 1,
        false
      ) as new_sequence_value;
    `;
    console.log(
      "✓ Fixed workout_exercises sequence. Next ID will be:",
      workoutExercisesResult[0].new_sequence_value
    );

    // Fix sets table sequence
    const setsResult = await sql`
      SELECT setval(
        pg_get_serial_sequence('sets', 'id'),
        COALESCE((SELECT MAX(id) FROM sets), 0) + 1,
        false
      ) as new_sequence_value;
    `;
    console.log(
      "✓ Fixed sets sequence. Next ID will be:",
      setsResult[0].new_sequence_value
    );

    console.log("\n✅ All sequences fixed successfully!");
  } catch (error) {
    console.error("❌ Error fixing sequences:", error);
    throw error;
  }
}

fixSequences();
