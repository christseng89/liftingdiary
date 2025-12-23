import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function dropTables() {
  try {
    console.log("🗑️  Dropping all tables...");

    // Drop tables in reverse order due to foreign key constraints
    await sql`DROP TABLE IF EXISTS sets CASCADE`;
    console.log("✅ Dropped: sets");

    await sql`DROP TABLE IF EXISTS workout_exercises CASCADE`;
    console.log("✅ Dropped: workout_exercises");

    await sql`DROP TABLE IF EXISTS workouts CASCADE`;
    console.log("✅ Dropped: workouts");

    await sql`DROP TABLE IF EXISTS exercises CASCADE`;
    console.log("✅ Dropped: exercises");

    console.log("✅ All tables dropped successfullyy");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error dropping tables:", error);
    process.exit(1);
  }
}

dropTables();
