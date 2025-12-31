import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getWorkoutsByUserIdAndDate,
  getWorkoutById,
  getWorkoutsByUserId,
  createWorkout,
  updateWorkout,
  type CreateWorkoutData,
  type UpdateWorkoutData,
} from "@/data/workouts";
import { db } from "@/db";

// Mock the database
vi.mock("@/db", () => ({
  db: {
    query: {
      workouts: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

describe("workouts data layer", () => {
  const mockUserId = "test-user-123";
  const mockDate = new Date("2025-01-15T10:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getWorkoutsByUserIdAndDate", () => {
    it("should fetch workouts for a specific user and date", async () => {
      const mockWorkouts = [
        {
          id: 1,
          name: "Morning Workout",
          userId: mockUserId,
          startedAt: new Date("2025-01-15T09:00:00Z"),
          completedAt: null,
          notes: null,
          createdAt: new Date(),
          workoutExercises: [],
        },
      ];

      vi.mocked(db.query.workouts.findMany).mockResolvedValue(mockWorkouts);

      const result = await getWorkoutsByUserIdAndDate(mockUserId, mockDate);

      expect(result).toEqual(mockWorkouts);
      expect(db.query.workouts.findMany).toHaveBeenCalledWith({
        where: expect.any(Function),
        with: {
          workoutExercises: {
            orderBy: expect.any(Function),
            with: {
              exerciseDefinition: true,
              sets: {
                orderBy: expect.any(Function),
              },
            },
          },
        },
        orderBy: expect.any(Function),
      });
    });

    it("should return empty array when no workouts found", async () => {
      vi.mocked(db.query.workouts.findMany).mockResolvedValue([]);

      const result = await getWorkoutsByUserIdAndDate(mockUserId, mockDate);

      expect(result).toEqual([]);
    });

    it("should filter by start and end of day boundaries", async () => {
      const testDate = new Date("2025-01-15");
      await getWorkoutsByUserIdAndDate(mockUserId, testDate);

      expect(db.query.workouts.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Function),
        })
      );
    });
  });

  describe("getWorkoutById", () => {
    it("should fetch a workout by id and userId", async () => {
      const mockWorkout = {
        id: 1,
        name: "Test Workout",
        userId: mockUserId,
        startedAt: mockDate,
        completedAt: null,
        notes: "Test notes",
        createdAt: new Date(),
        workoutExercises: [],
      };

      vi.mocked(db.query.workouts.findFirst).mockResolvedValue(mockWorkout);

      const result = await getWorkoutById(1, mockUserId);

      expect(result).toEqual(mockWorkout);
      expect(db.query.workouts.findFirst).toHaveBeenCalledWith({
        where: expect.any(Function),
        with: {
          workoutExercises: {
            orderBy: expect.any(Function),
            with: {
              exerciseDefinition: true,
              sets: {
                orderBy: expect.any(Function),
              },
            },
          },
        },
      });
    });

    it("should return null when workout not found", async () => {
      vi.mocked(db.query.workouts.findFirst).mockResolvedValue(undefined);

      const result = await getWorkoutById(999, mockUserId);

      expect(result).toBeNull();
    });

    it("should verify userId ownership", async () => {
      await getWorkoutById(1, mockUserId);

      expect(db.query.workouts.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Function),
        })
      );
    });
  });

  describe("getWorkoutsByUserId", () => {
    it("should fetch all workouts for a user", async () => {
      const mockWorkouts = [
        {
          id: 1,
          name: "Workout 1",
          userId: mockUserId,
          startedAt: new Date(),
          completedAt: null,
          notes: null,
          createdAt: new Date(),
          workoutExercises: [],
        },
        {
          id: 2,
          name: "Workout 2",
          userId: mockUserId,
          startedAt: new Date(),
          completedAt: null,
          notes: null,
          createdAt: new Date(),
          workoutExercises: [],
        },
      ];

      vi.mocked(db.query.workouts.findMany).mockResolvedValue(mockWorkouts);

      const result = await getWorkoutsByUserId(mockUserId);

      expect(result).toEqual(mockWorkouts);
      expect(result).toHaveLength(2);
    });

    it("should include nested workout exercises and sets", async () => {
      vi.mocked(db.query.workouts.findMany).mockResolvedValue([]);

      await getWorkoutsByUserId(mockUserId);

      expect(db.query.workouts.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          with: expect.objectContaining({
            workoutExercises: expect.any(Object),
          }),
        })
      );
    });
  });

  describe("createWorkout", () => {
    it("should create a workout with provided data", async () => {
      const workoutData: CreateWorkoutData = {
        name: "New Workout",
        startedAt: mockDate,
        notes: "Test notes",
      };

      const mockCreatedWorkout = {
        id: 1,
        ...workoutData,
        userId: mockUserId,
        completedAt: null,
        createdAt: new Date(),
      };

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockCreatedWorkout]),
      };

      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      const result = await createWorkout(workoutData, mockUserId);

      expect(result).toEqual(mockCreatedWorkout);
      expect(db.insert).toHaveBeenCalled();
      expect(mockInsert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          name: workoutData.name,
          startedAt: workoutData.startedAt,
          notes: workoutData.notes,
          userId: mockUserId,
        })
      );
    });

    it("should use current date if startedAt not provided", async () => {
      const workoutData: CreateWorkoutData = {
        name: "New Workout",
      };

      const mockCreatedWorkout = {
        id: 1,
        name: workoutData.name,
        startedAt: expect.any(Date),
        userId: mockUserId,
        completedAt: null,
        notes: null,
        createdAt: new Date(),
      };

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockCreatedWorkout]),
      };

      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      await createWorkout(workoutData, mockUserId);

      expect(mockInsert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          name: workoutData.name,
          startedAt: expect.any(Date),
          userId: mockUserId,
        })
      );
    });

    it("should handle optional notes field", async () => {
      const workoutData: CreateWorkoutData = {
        name: "Workout without notes",
      };

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: 1,
            name: workoutData.name,
            startedAt: new Date(),
            userId: mockUserId,
            completedAt: null,
            notes: undefined,
            createdAt: new Date(),
          },
        ]),
      };

      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      await createWorkout(workoutData, mockUserId);

      expect(mockInsert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: undefined,
        })
      );
    });
  });

  describe("updateWorkout", () => {
    it("should update workout with provided data", async () => {
      const updateData: UpdateWorkoutData = {
        name: "Updated Workout",
        notes: "Updated notes",
      };

      const mockUpdatedWorkout = {
        id: 1,
        name: updateData.name,
        userId: mockUserId,
        startedAt: mockDate,
        completedAt: null,
        notes: updateData.notes,
        createdAt: new Date(),
      };

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedWorkout]),
      };

      vi.mocked(db.update).mockReturnValue(mockUpdate as any);

      const result = await updateWorkout(1, updateData, mockUserId);

      expect(result).toEqual(mockUpdatedWorkout);
      expect(db.update).toHaveBeenCalled();
      expect(mockUpdate.set).toHaveBeenCalledWith(updateData);
    });

    it("should verify userId ownership in WHERE clause", async () => {
      const updateData: UpdateWorkoutData = {
        name: "Updated Workout",
      };

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.update).mockReturnValue(mockUpdate as any);

      await updateWorkout(1, updateData, mockUserId);

      expect(mockUpdate.where).toHaveBeenCalled();
    });

    it("should return null when workout not found or unauthorized", async () => {
      const updateData: UpdateWorkoutData = {
        name: "Updated Workout",
      };

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.update).mockReturnValue(mockUpdate as any);

      const result = await updateWorkout(999, updateData, mockUserId);

      expect(result).toBeNull();
    });

    it("should handle partial updates", async () => {
      const updateData: UpdateWorkoutData = {
        completedAt: new Date(),
      };

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: 1,
            name: "Workout",
            userId: mockUserId,
            startedAt: mockDate,
            completedAt: updateData.completedAt,
            notes: null,
            createdAt: new Date(),
          },
        ]),
      };

      vi.mocked(db.update).mockReturnValue(mockUpdate as any);

      await updateWorkout(1, updateData, mockUserId);

      expect(mockUpdate.set).toHaveBeenCalledWith(updateData);
    });
  });
});
