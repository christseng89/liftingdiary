import { pgTable, varchar, text, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Table 1: Exercise Definitions - Shared catalog of exercise types
export const exerciseDefinitions = pgTable("exercise_definitions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity({
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 2147483647,
    cache: 1
  }),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull()
    .$onUpdateFn(() => new Date()),
});

// Table 2: Workouts - User workout sessions
export const workouts = pgTable("workouts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity({
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 2147483647,
    cache: 1
  }),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  startedAt: timestamp("started_at", { mode: "date" }),
  completedAt: timestamp("completed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull()
    .$onUpdateFn(() => new Date()),
});

// Table 3: Workout Exercises - Junction table linking exercises to workouts
export const workoutExercises = pgTable("workout_exercises", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity({
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 2147483647,
    cache: 1
  }),
  workoutId: integer("workout_id").notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").notNull()
    .references(() => exerciseDefinitions.id, { onDelete: "restrict" }),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Table 4: Exercise Sets - Individual sets for each exercise
export const exerciseSets = pgTable("exercise_sets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity({
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 2147483647,
    cache: 1
  }),
  workoutExerciseId: integer("workout_exercise_id").notNull()
    .references(() => workoutExercises.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  reps: integer("reps").notNull(),
  weightLbs: numeric("weight_lbs", { precision: 6, scale: 2 }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Relations for type-safe queries
export const exerciseDefinitionsRelations = relations(exerciseDefinitions, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}));

export const workoutsRelations = relations(workouts, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(workoutExercises, ({ one, many }) => ({
  workout: one(workouts, {
    fields: [workoutExercises.workoutId],
    references: [workouts.id],
  }),
  exerciseDefinition: one(exerciseDefinitions, {
    fields: [workoutExercises.exerciseId],
    references: [exerciseDefinitions.id],
  }),
  sets: many(exerciseSets),
}));

export const exerciseSetsRelations = relations(exerciseSets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [exerciseSets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}));

// Type exports for TypeScript inference
export type ExerciseDefinition = typeof exerciseDefinitions.$inferSelect;
export type NewExerciseDefinition = typeof exerciseDefinitions.$inferInsert;

export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;

export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type NewWorkoutExercise = typeof workoutExercises.$inferInsert;

export type ExerciseSet = typeof exerciseSets.$inferSelect;
export type NewExerciseSet = typeof exerciseSets.$inferInsert;

// Complex type for queries with relations
export type WorkoutWithExercises = Workout & {
  workoutExercises: (WorkoutExercise & {
    exerciseDefinition: ExerciseDefinition;
    sets: ExerciseSet[];
  })[];
};
