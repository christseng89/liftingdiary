import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addSetToExercise,
  updateSet,
  deleteSet,
  type CreateSetData,
  type UpdateSetData,
} from "@/data/sets";
import { db } from "@/db";

// Mock the database
vi.mock("@/db", () => ({
  db: {
    query: {
      workoutExercises: {
        findFirst: vi.fn(),
      },
      exerciseSets: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("sets data layer", () => {
  const mockUserId = "test-user-123";
  const mockWorkoutId = 1;
  const mockWorkoutExerciseId = 10;
  const mockSetId = 100;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addSetToExercise", () => {
    it("should add set to exercise after verifying ownership", async () => {
      const setData: CreateSetData = {
        reps: 10,
        weightLbs: 135,
      };

      const mockWorkoutExercise = {
        id: mockWorkoutExerciseId,
        workoutId: mockWorkoutId,
        exerciseId: 5,
        order: 0,
        createdAt: new Date(),
        workout: {
          id: mockWorkoutId,
          userId: mockUserId,
          name: "Test Workout",
          startedAt: new Date(),
          completedAt: null,
          notes: null,
          createdAt: new Date(),
        },
      };

      const mockExistingSets = [
        {
          id: 1,
          workoutExerciseId: mockWorkoutExerciseId,
          order: 0,
          reps: 8,
          weightLbs: "125",
          createdAt: new Date(),
        },
      ];

      const mockNewSet = {
        id: mockSetId,
        workoutExerciseId: mockWorkoutExerciseId,
        order: 1,
        reps: setData.reps,
        weightLbs: setData.weightLbs?.toString() || null,
        createdAt: new Date(),
      };

      vi.mocked(db.query.workoutExercises.findFirst).mockResolvedValue(
        mockWorkoutExercise
      );
      vi.mocked(db.query.exerciseSets.findMany).mockResolvedValue(
        mockExistingSets
      );

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockNewSet]),
      };

      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      const result = await addSetToExercise(
        mockWorkoutExerciseId,
        mockWorkoutId,
        setData,
        mockUserId
      );

      expect(result).toEqual(mockNewSet);
      expect(db.query.workoutExercises.findFirst).toHaveBeenCalled();
      expect(mockInsert.values).toHaveBeenCalledWith({
        workoutExerciseId: mockWorkoutExerciseId,
        order: 1,
        reps: setData.reps,
        weightLbs: "135",
      });
    });

    it("should return null when workout exercise not found", async () => {
      const setData: CreateSetData = {
        reps: 10,
        weightLbs: 135,
      };

      vi.mocked(db.query.workoutExercises.findFirst).mockResolvedValue(undefined);

      const result = await addSetToExercise(
        mockWorkoutExerciseId,
        mockWorkoutId,
        setData,
        mockUserId
      );

      expect(result).toBeNull();
      expect(db.insert).not.toHaveBeenCalled();
    });

    it("should return null when user not authorized", async () => {
      const setData: CreateSetData = {
        reps: 10,
        weightLbs: 135,
      };

      const mockWorkoutExercise = {
        id: mockWorkoutExerciseId,
        workoutId: mockWorkoutId,
        exerciseId: 5,
        order: 0,
        createdAt: new Date(),
        workout: {
          id: mockWorkoutId,
          userId: "different-user",
          name: "Test Workout",
          startedAt: new Date(),
          completedAt: null,
          notes: null,
          createdAt: new Date(),
        },
      };

      vi.mocked(db.query.workoutExercises.findFirst).mockResolvedValue(
        mockWorkoutExercise
      );

      const result = await addSetToExercise(
        mockWorkoutExerciseId,
        mockWorkoutId,
        setData,
        mockUserId
      );

      expect(result).toBeNull();
      expect(db.insert).not.toHaveBeenCalled();
    });

    it("should set order to 0 for first set", async () => {
      const setData: CreateSetData = {
        reps: 10,
        weightLbs: 135,
      };

      const mockWorkoutExercise = {
        id: mockWorkoutExerciseId,
        workoutId: mockWorkoutId,
        exerciseId: 5,
        order: 0,
        createdAt: new Date(),
        workout: {
          id: mockWorkoutId,
          userId: mockUserId,
          name: "Test Workout",
          startedAt: new Date(),
          completedAt: null,
          notes: null,
          createdAt: new Date(),
        },
      };

      vi.mocked(db.query.workoutExercises.findFirst).mockResolvedValue(
        mockWorkoutExercise
      );
      vi.mocked(db.query.exerciseSets.findMany).mockResolvedValue([]);

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: mockSetId,
            workoutExerciseId: mockWorkoutExerciseId,
            order: 0,
            reps: setData.reps,
            weightLbs: "135",
            createdAt: new Date(),
          },
        ]),
      };

      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      await addSetToExercise(
        mockWorkoutExerciseId,
        mockWorkoutId,
        setData,
        mockUserId
      );

      expect(mockInsert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          order: 0,
        })
      );
    });

    it("should handle sets without weight", async () => {
      const setData: CreateSetData = {
        reps: 10,
      };

      const mockWorkoutExercise = {
        id: mockWorkoutExerciseId,
        workoutId: mockWorkoutId,
        exerciseId: 5,
        order: 0,
        createdAt: new Date(),
        workout: {
          id: mockWorkoutId,
          userId: mockUserId,
          name: "Test Workout",
          startedAt: new Date(),
          completedAt: null,
          notes: null,
          createdAt: new Date(),
        },
      };

      vi.mocked(db.query.workoutExercises.findFirst).mockResolvedValue(
        mockWorkoutExercise
      );
      vi.mocked(db.query.exerciseSets.findMany).mockResolvedValue([]);

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: mockSetId,
            workoutExerciseId: mockWorkoutExerciseId,
            order: 0,
            reps: setData.reps,
            weightLbs: null,
            createdAt: new Date(),
          },
        ]),
      };

      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      await addSetToExercise(
        mockWorkoutExerciseId,
        mockWorkoutId,
        setData,
        mockUserId
      );

      expect(mockInsert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          weightLbs: null,
        })
      );
    });

    it("should convert weight to string", async () => {
      const setData: CreateSetData = {
        reps: 10,
        weightLbs: 225.5,
      };

      const mockWorkoutExercise = {
        id: mockWorkoutExerciseId,
        workoutId: mockWorkoutId,
        exerciseId: 5,
        order: 0,
        createdAt: new Date(),
        workout: {
          id: mockWorkoutId,
          userId: mockUserId,
          name: "Test Workout",
          startedAt: new Date(),
          completedAt: null,
          notes: null,
          createdAt: new Date(),
        },
      };

      vi.mocked(db.query.workoutExercises.findFirst).mockResolvedValue(
        mockWorkoutExercise
      );
      vi.mocked(db.query.exerciseSets.findMany).mockResolvedValue([]);

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      await addSetToExercise(
        mockWorkoutExerciseId,
        mockWorkoutId,
        setData,
        mockUserId
      );

      expect(mockInsert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          weightLbs: "225.5",
        })
      );
    });
  });

  describe("updateSet", () => {
    it("should update set after verifying ownership", async () => {
      const updateData: UpdateSetData = {
        reps: 12,
        weightLbs: 145,
      };

      const mockSet = {
        id: mockSetId,
        workoutExerciseId: mockWorkoutExerciseId,
        order: 0,
        reps: 10,
        weightLbs: "135",
        createdAt: new Date(),
        workoutExercise: {
          id: mockWorkoutExerciseId,
          workoutId: mockWorkoutId,
          exerciseId: 5,
          order: 0,
          createdAt: new Date(),
          workout: {
            id: mockWorkoutId,
            userId: mockUserId,
            name: "Test Workout",
            startedAt: new Date(),
            completedAt: null,
            notes: null,
            createdAt: new Date(),
          },
        },
      };

      const mockUpdatedSet = {
        ...mockSet,
        reps: updateData.reps,
        weightLbs: updateData.weightLbs?.toString(),
      };

      vi.mocked(db.query.exerciseSets.findFirst).mockResolvedValue(mockSet);

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedSet]),
      };

      vi.mocked(db.update).mockReturnValue(mockUpdate as any);

      const result = await updateSet(
        mockSetId,
        mockWorkoutId,
        updateData,
        mockUserId
      );

      expect(result).toEqual(mockUpdatedSet);
      expect(db.query.exerciseSets.findFirst).toHaveBeenCalled();
      expect(mockUpdate.set).toHaveBeenCalledWith({
        reps: 12,
        weightLbs: "145",
      });
    });

    it("should return null when set not found", async () => {
      const updateData: UpdateSetData = {
        reps: 12,
      };

      vi.mocked(db.query.exerciseSets.findFirst).mockResolvedValue(undefined);

      const result = await updateSet(
        mockSetId,
        mockWorkoutId,
        updateData,
        mockUserId
      );

      expect(result).toBeNull();
      expect(db.update).not.toHaveBeenCalled();
    });

    it("should return null when workout id mismatch", async () => {
      const updateData: UpdateSetData = {
        reps: 12,
      };

      const mockSet = {
        id: mockSetId,
        workoutExerciseId: mockWorkoutExerciseId,
        order: 0,
        reps: 10,
        weightLbs: "135",
        createdAt: new Date(),
        workoutExercise: {
          id: mockWorkoutExerciseId,
          workoutId: 999,
          exerciseId: 5,
          order: 0,
          createdAt: new Date(),
          workout: {
            id: 999,
            userId: mockUserId,
            name: "Test Workout",
            startedAt: new Date(),
            completedAt: null,
            notes: null,
            createdAt: new Date(),
          },
        },
      };

      vi.mocked(db.query.exerciseSets.findFirst).mockResolvedValue(mockSet);

      const result = await updateSet(
        mockSetId,
        mockWorkoutId,
        updateData,
        mockUserId
      );

      expect(result).toBeNull();
    });

    it("should return null when user not authorized", async () => {
      const updateData: UpdateSetData = {
        reps: 12,
      };

      const mockSet = {
        id: mockSetId,
        workoutExerciseId: mockWorkoutExerciseId,
        order: 0,
        reps: 10,
        weightLbs: "135",
        createdAt: new Date(),
        workoutExercise: {
          id: mockWorkoutExerciseId,
          workoutId: mockWorkoutId,
          exerciseId: 5,
          order: 0,
          createdAt: new Date(),
          workout: {
            id: mockWorkoutId,
            userId: "different-user",
            name: "Test Workout",
            startedAt: new Date(),
            completedAt: null,
            notes: null,
            createdAt: new Date(),
          },
        },
      };

      vi.mocked(db.query.exerciseSets.findFirst).mockResolvedValue(mockSet);

      const result = await updateSet(
        mockSetId,
        mockWorkoutId,
        updateData,
        mockUserId
      );

      expect(result).toBeNull();
    });

    it("should handle partial updates - reps only", async () => {
      const updateData: UpdateSetData = {
        reps: 15,
      };

      const mockSet = {
        id: mockSetId,
        workoutExerciseId: mockWorkoutExerciseId,
        order: 0,
        reps: 10,
        weightLbs: "135",
        createdAt: new Date(),
        workoutExercise: {
          id: mockWorkoutExerciseId,
          workoutId: mockWorkoutId,
          exerciseId: 5,
          order: 0,
          createdAt: new Date(),
          workout: {
            id: mockWorkoutId,
            userId: mockUserId,
            name: "Test Workout",
            startedAt: new Date(),
            completedAt: null,
            notes: null,
            createdAt: new Date(),
          },
        },
      };

      vi.mocked(db.query.exerciseSets.findFirst).mockResolvedValue(mockSet);

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ ...mockSet, reps: 15 }]),
      };

      vi.mocked(db.update).mockReturnValue(mockUpdate as any);

      await updateSet(mockSetId, mockWorkoutId, updateData, mockUserId);

      expect(mockUpdate.set).toHaveBeenCalledWith({
        reps: 15,
      });
    });

    it("should handle partial updates - weight only", async () => {
      const updateData: UpdateSetData = {
        weightLbs: 155,
      };

      const mockSet = {
        id: mockSetId,
        workoutExerciseId: mockWorkoutExerciseId,
        order: 0,
        reps: 10,
        weightLbs: "135",
        createdAt: new Date(),
        workoutExercise: {
          id: mockWorkoutExerciseId,
          workoutId: mockWorkoutId,
          exerciseId: 5,
          order: 0,
          createdAt: new Date(),
          workout: {
            id: mockWorkoutId,
            userId: mockUserId,
            name: "Test Workout",
            startedAt: new Date(),
            completedAt: null,
            notes: null,
            createdAt: new Date(),
          },
        },
      };

      vi.mocked(db.query.exerciseSets.findFirst).mockResolvedValue(mockSet);

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          { ...mockSet, weightLbs: "155" },
        ]),
      };

      vi.mocked(db.update).mockReturnValue(mockUpdate as any);

      await updateSet(mockSetId, mockWorkoutId, updateData, mockUserId);

      expect(mockUpdate.set).toHaveBeenCalledWith({
        weightLbs: "155",
      });
    });
  });

  describe("deleteSet", () => {
    it("should delete set after verifying ownership", async () => {
      const mockSet = {
        id: mockSetId,
        workoutExerciseId: mockWorkoutExerciseId,
        order: 0,
        reps: 10,
        weightLbs: "135",
        createdAt: new Date(),
        workoutExercise: {
          id: mockWorkoutExerciseId,
          workoutId: mockWorkoutId,
          exerciseId: 5,
          order: 0,
          createdAt: new Date(),
          workout: {
            id: mockWorkoutId,
            userId: mockUserId,
            name: "Test Workout",
            startedAt: new Date(),
            completedAt: null,
            notes: null,
            createdAt: new Date(),
          },
        },
      };

      vi.mocked(db.query.exerciseSets.findFirst).mockResolvedValue(mockSet);

      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockSetId }]),
      };

      vi.mocked(db.delete).mockReturnValue(mockDelete as any);

      const result = await deleteSet(mockSetId, mockWorkoutId, mockUserId);

      expect(result).toBe(true);
      expect(db.query.exerciseSets.findFirst).toHaveBeenCalled();
      expect(db.delete).toHaveBeenCalled();
    });

    it("should return false when set not found", async () => {
      vi.mocked(db.query.exerciseSets.findFirst).mockResolvedValue(undefined);

      const result = await deleteSet(mockSetId, mockWorkoutId, mockUserId);

      expect(result).toBe(false);
      expect(db.delete).not.toHaveBeenCalled();
    });

    it("should return false when workout id mismatch", async () => {
      const mockSet = {
        id: mockSetId,
        workoutExerciseId: mockWorkoutExerciseId,
        order: 0,
        reps: 10,
        weightLbs: "135",
        createdAt: new Date(),
        workoutExercise: {
          id: mockWorkoutExerciseId,
          workoutId: 999,
          exerciseId: 5,
          order: 0,
          createdAt: new Date(),
          workout: {
            id: 999,
            userId: mockUserId,
            name: "Test Workout",
            startedAt: new Date(),
            completedAt: null,
            notes: null,
            createdAt: new Date(),
          },
        },
      };

      vi.mocked(db.query.exerciseSets.findFirst).mockResolvedValue(mockSet);

      const result = await deleteSet(mockSetId, mockWorkoutId, mockUserId);

      expect(result).toBe(false);
    });

    it("should return false when user not authorized", async () => {
      const mockSet = {
        id: mockSetId,
        workoutExerciseId: mockWorkoutExerciseId,
        order: 0,
        reps: 10,
        weightLbs: "135",
        createdAt: new Date(),
        workoutExercise: {
          id: mockWorkoutExerciseId,
          workoutId: mockWorkoutId,
          exerciseId: 5,
          order: 0,
          createdAt: new Date(),
          workout: {
            id: mockWorkoutId,
            userId: "different-user",
            name: "Test Workout",
            startedAt: new Date(),
            completedAt: null,
            notes: null,
            createdAt: new Date(),
          },
        },
      };

      vi.mocked(db.query.exerciseSets.findFirst).mockResolvedValue(mockSet);

      const result = await deleteSet(mockSetId, mockWorkoutId, mockUserId);

      expect(result).toBe(false);
    });

    it("should return false when set not deleted", async () => {
      const mockSet = {
        id: mockSetId,
        workoutExerciseId: mockWorkoutExerciseId,
        order: 0,
        reps: 10,
        weightLbs: "135",
        createdAt: new Date(),
        workoutExercise: {
          id: mockWorkoutExerciseId,
          workoutId: mockWorkoutId,
          exerciseId: 5,
          order: 0,
          createdAt: new Date(),
          workout: {
            id: mockWorkoutId,
            userId: mockUserId,
            name: "Test Workout",
            startedAt: new Date(),
            completedAt: null,
            notes: null,
            createdAt: new Date(),
          },
        },
      };

      vi.mocked(db.query.exerciseSets.findFirst).mockResolvedValue(mockSet);

      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.delete).mockReturnValue(mockDelete as any);

      const result = await deleteSet(mockSetId, mockWorkoutId, mockUserId);

      expect(result).toBe(false);
    });
  });
});
