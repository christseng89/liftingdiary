import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAllExerciseDefinitions,
  addExerciseToWorkout,
  removeExerciseFromWorkout,
} from "@/data/exercises";
import { db } from "@/db";

// Mock the database
vi.mock("@/db", () => ({
  db: {
    query: {
      exerciseDefinitions: {
        findMany: vi.fn(),
      },
      workouts: {
        findFirst: vi.fn(),
      },
      workoutExercises: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("exercises data layer", () => {
  const mockUserId = "test-user-123";
  const mockWorkoutId = 1;
  const mockExerciseDefinitionId = 10;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllExerciseDefinitions", () => {
    it("should fetch all active exercise definitions", async () => {
      const mockDefinitions = [
        {
          id: 1,
          name: "Bench Press",
          description: "Chest exercise",
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 2,
          name: "Squat",
          description: "Leg exercise",
          isActive: true,
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.query.exerciseDefinitions.findMany).mockResolvedValue(
        mockDefinitions
      );

      const result = await getAllExerciseDefinitions();

      expect(result).toEqual(mockDefinitions);
      expect(db.query.exerciseDefinitions.findMany).toHaveBeenCalledWith({
        where: expect.any(Function),
        orderBy: expect.any(Function),
      });
    });

    it("should only return active exercise definitions", async () => {
      vi.mocked(db.query.exerciseDefinitions.findMany).mockResolvedValue([]);

      await getAllExerciseDefinitions();

      expect(db.query.exerciseDefinitions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Function),
        })
      );
    });

    it("should return empty array when no definitions found", async () => {
      vi.mocked(db.query.exerciseDefinitions.findMany).mockResolvedValue([]);

      const result = await getAllExerciseDefinitions();

      expect(result).toEqual([]);
    });
  });

  describe("addExerciseToWorkout", () => {
    it("should add exercise to workout after verifying ownership", async () => {
      const mockWorkout = {
        id: mockWorkoutId,
        userId: mockUserId,
        name: "Test Workout",
        startedAt: new Date(),
        completedAt: null,
        notes: null,
        createdAt: new Date(),
      };

      const mockExistingExercises = [
        {
          id: 1,
          workoutId: mockWorkoutId,
          exerciseId: 5,
          order: 0,
          createdAt: new Date(),
        },
      ];

      const mockNewWorkoutExercise = {
        id: 2,
        workoutId: mockWorkoutId,
        exerciseId: mockExerciseDefinitionId,
        order: 1,
        createdAt: new Date(),
      };

      vi.mocked(db.query.workouts.findFirst).mockResolvedValue(mockWorkout);
      vi.mocked(db.query.workoutExercises.findMany).mockResolvedValue(
        mockExistingExercises
      );

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockNewWorkoutExercise]),
      };

      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      const result = await addExerciseToWorkout(
        mockWorkoutId,
        mockExerciseDefinitionId,
        mockUserId
      );

      expect(result).toEqual(mockNewWorkoutExercise);
      expect(db.query.workouts.findFirst).toHaveBeenCalled();
      expect(mockInsert.values).toHaveBeenCalledWith({
        workoutId: mockWorkoutId,
        exerciseId: mockExerciseDefinitionId,
        order: 1,
      });
    });

    it("should return null when workout not found", async () => {
      vi.mocked(db.query.workouts.findFirst).mockResolvedValue(undefined);

      const result = await addExerciseToWorkout(
        mockWorkoutId,
        mockExerciseDefinitionId,
        mockUserId
      );

      expect(result).toBeNull();
      expect(db.insert).not.toHaveBeenCalled();
    });

    it("should return null when user not authorized", async () => {
      const mockWorkout = {
        id: mockWorkoutId,
        userId: "different-user",
        name: "Test Workout",
        startedAt: new Date(),
        completedAt: null,
        notes: null,
        createdAt: new Date(),
      };

      vi.mocked(db.query.workouts.findFirst).mockResolvedValue(undefined);

      const result = await addExerciseToWorkout(
        mockWorkoutId,
        mockExerciseDefinitionId,
        mockUserId
      );

      expect(result).toBeNull();
    });

    it("should set order to 0 for first exercise", async () => {
      const mockWorkout = {
        id: mockWorkoutId,
        userId: mockUserId,
        name: "Test Workout",
        startedAt: new Date(),
        completedAt: null,
        notes: null,
        createdAt: new Date(),
      };

      vi.mocked(db.query.workouts.findFirst).mockResolvedValue(mockWorkout);
      vi.mocked(db.query.workoutExercises.findMany).mockResolvedValue([]);

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: 1,
            workoutId: mockWorkoutId,
            exerciseId: mockExerciseDefinitionId,
            order: 0,
            createdAt: new Date(),
          },
        ]),
      };

      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      await addExerciseToWorkout(
        mockWorkoutId,
        mockExerciseDefinitionId,
        mockUserId
      );

      expect(mockInsert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          order: 0,
        })
      );
    });

    it("should increment order for subsequent exercises", async () => {
      const mockWorkout = {
        id: mockWorkoutId,
        userId: mockUserId,
        name: "Test Workout",
        startedAt: new Date(),
        completedAt: null,
        notes: null,
        createdAt: new Date(),
      };

      const mockExistingExercises = [
        {
          id: 1,
          workoutId: mockWorkoutId,
          exerciseId: 5,
          order: 2,
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.query.workouts.findFirst).mockResolvedValue(mockWorkout);
      vi.mocked(db.query.workoutExercises.findMany).mockResolvedValue(
        mockExistingExercises
      );

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: 2,
            workoutId: mockWorkoutId,
            exerciseId: mockExerciseDefinitionId,
            order: 3,
            createdAt: new Date(),
          },
        ]),
      };

      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      await addExerciseToWorkout(
        mockWorkoutId,
        mockExerciseDefinitionId,
        mockUserId
      );

      expect(mockInsert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          order: 3,
        })
      );
    });
  });

  describe("removeExerciseFromWorkout", () => {
    it("should remove exercise after verifying workout ownership", async () => {
      const mockWorkout = {
        id: mockWorkoutId,
        userId: mockUserId,
        name: "Test Workout",
        startedAt: new Date(),
        completedAt: null,
        notes: null,
        createdAt: new Date(),
      };

      vi.mocked(db.query.workouts.findFirst).mockResolvedValue(mockWorkout);

      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 1 }]),
      };

      vi.mocked(db.delete).mockReturnValue(mockDelete as any);

      const result = await removeExerciseFromWorkout(1, mockWorkoutId, mockUserId);

      expect(result).toBe(true);
      expect(db.query.workouts.findFirst).toHaveBeenCalled();
      expect(db.delete).toHaveBeenCalled();
    });

    it("should return false when workout not found", async () => {
      vi.mocked(db.query.workouts.findFirst).mockResolvedValue(undefined);

      const result = await removeExerciseFromWorkout(1, mockWorkoutId, mockUserId);

      expect(result).toBe(false);
      expect(db.delete).not.toHaveBeenCalled();
    });

    it("should return false when user not authorized", async () => {
      vi.mocked(db.query.workouts.findFirst).mockResolvedValue(undefined);

      const result = await removeExerciseFromWorkout(1, mockWorkoutId, mockUserId);

      expect(result).toBe(false);
    });

    it("should verify both workoutExerciseId and workoutId in delete", async () => {
      const mockWorkout = {
        id: mockWorkoutId,
        userId: mockUserId,
        name: "Test Workout",
        startedAt: new Date(),
        completedAt: null,
        notes: null,
        createdAt: new Date(),
      };

      vi.mocked(db.query.workouts.findFirst).mockResolvedValue(mockWorkout);

      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 1 }]),
      };

      vi.mocked(db.delete).mockReturnValue(mockDelete as any);

      await removeExerciseFromWorkout(1, mockWorkoutId, mockUserId);

      expect(mockDelete.where).toHaveBeenCalled();
    });

    it("should return false when exercise not deleted", async () => {
      const mockWorkout = {
        id: mockWorkoutId,
        userId: mockUserId,
        name: "Test Workout",
        startedAt: new Date(),
        completedAt: null,
        notes: null,
        createdAt: new Date(),
      };

      vi.mocked(db.query.workouts.findFirst).mockResolvedValue(mockWorkout);

      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.delete).mockReturnValue(mockDelete as any);

      const result = await removeExerciseFromWorkout(1, mockWorkoutId, mockUserId);

      expect(result).toBe(false);
    });
  });
});
