import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  updateWorkoutAction,
  addExerciseAction,
  removeExerciseAction,
  addSetAction,
  updateSetAction,
  deleteSetAction,
  type UpdateWorkoutInput,
  type AddExerciseInput,
  type RemoveExerciseInput,
  type AddSetInput,
  type UpdateSetInput,
  type DeleteSetInput,
} from "@/app/dashboard/workout/[workoutId]/actions";
import { updateWorkout } from "@/data/workouts";
import {
  addExerciseToWorkout,
  removeExerciseFromWorkout,
} from "@/data/exercises";
import { addSetToExercise, updateSet, deleteSet } from "@/data/sets";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Mock dependencies
vi.mock("@/data/workouts");
vi.mock("@/data/exercises");
vi.mock("@/data/sets");
vi.mock("@clerk/nextjs/server");
vi.mock("next/cache");

describe("Workout Actions", () => {
  const mockUserId = "test-user-123";
  const mockWorkoutId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
  });

  describe("updateWorkoutAction", () => {
    it("should update workout with valid input", async () => {
      const input: UpdateWorkoutInput = {
        workoutId: mockWorkoutId,
        name: "Updated Workout",
        notes: "Updated notes",
      };

      const mockUpdated = {
        id: mockWorkoutId,
        name: input.name,
        notes: input.notes,
        userId: mockUserId,
        startedAt: new Date(),
        completedAt: null,
        createdAt: new Date(),
      };

      vi.mocked(updateWorkout).mockResolvedValue(mockUpdated as any);

      const result = await updateWorkoutAction(input);

      expect(result).toEqual({
        success: true,
        redirectUrl: "/dashboard",
      });
      expect(updateWorkout).toHaveBeenCalledWith(
        mockWorkoutId,
        {
          name: input.name,
          notes: input.notes,
        },
        mockUserId
      );
      expect(revalidatePath).toHaveBeenCalledWith(
        `/dashboard/workout/${mockWorkoutId}`
      );
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    });

    it("should redirect with date parameter when redirectDate provided", async () => {
      const input: UpdateWorkoutInput = {
        workoutId: mockWorkoutId,
        name: "Test Workout",
        redirectDate: "2025-01-15",
      };

      vi.mocked(updateWorkout).mockResolvedValue({
        id: mockWorkoutId,
        name: input.name,
        userId: mockUserId,
        startedAt: new Date(),
        completedAt: null,
        notes: null,
        createdAt: new Date(),
      } as any);

      const result = await updateWorkoutAction(input);

      expect(result).toEqual({
        success: true,
        redirectUrl: "/dashboard?date=2025-01-15",
      });
    });

    it("should return error when workout not found", async () => {
      const input: UpdateWorkoutInput = {
        workoutId: 999,
        name: "Test Workout",
      };

      vi.mocked(updateWorkout).mockResolvedValue(null);

      const result = await updateWorkoutAction(input);

      expect(result).toEqual({
        success: false,
        error: "Workout not found or unauthorized",
      });
    });

    it("should return error when user not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const input: UpdateWorkoutInput = {
        workoutId: mockWorkoutId,
        name: "Test Workout",
      };

      const result = await updateWorkoutAction(input);

      expect(result).toEqual({
        success: false,
        error: "Unauthorized",
      });
    });

    it("should validate completedAt is after startedAt", async () => {
      const startedAt = new Date("2025-01-15T10:00:00Z");
      const completedAt = new Date("2025-01-15T09:00:00Z"); // Before startedAt

      const input: UpdateWorkoutInput = {
        workoutId: mockWorkoutId,
        name: "Test Workout",
        startedAt,
        completedAt,
      };

      const result = await updateWorkoutAction(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Validation failed");
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["completedAt"],
          }),
        ])
      );
    });

    it("should allow completedAt after startedAt", async () => {
      const startedAt = new Date("2025-01-15T09:00:00Z");
      const completedAt = new Date("2025-01-15T10:00:00Z");

      const input: UpdateWorkoutInput = {
        workoutId: mockWorkoutId,
        name: "Test Workout",
        startedAt,
        completedAt,
      };

      vi.mocked(updateWorkout).mockResolvedValue({
        id: mockWorkoutId,
        name: input.name,
        startedAt,
        completedAt,
        userId: mockUserId,
        notes: null,
        createdAt: new Date(),
      } as any);

      const result = await updateWorkoutAction(input);

      expect(result.success).toBe(true);
    });

    it("should validate name length constraints", async () => {
      const input: UpdateWorkoutInput = {
        workoutId: mockWorkoutId,
        name: "",
      };

      const result = await updateWorkoutAction(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Validation failed");
    });
  });

  describe("addExerciseAction", () => {
    it("should add exercise to workout", async () => {
      const input: AddExerciseInput = {
        workoutId: mockWorkoutId,
        exerciseDefinitionId: 10,
      };

      const mockWorkoutExercise = {
        id: 1,
        workoutId: mockWorkoutId,
        exerciseId: 10,
        order: 0,
        createdAt: new Date(),
      };

      vi.mocked(addExerciseToWorkout).mockResolvedValue(mockWorkoutExercise as any);

      const result = await addExerciseAction(input);

      expect(result).toEqual({
        success: true,
        redirectUrl: `/dashboard/workout/${mockWorkoutId}`,
      });
      expect(addExerciseToWorkout).toHaveBeenCalledWith(
        mockWorkoutId,
        10,
        mockUserId
      );
      expect(revalidatePath).toHaveBeenCalledWith(
        `/dashboard/workout/${mockWorkoutId}`
      );
    });

    it("should return error when workout not found", async () => {
      const input: AddExerciseInput = {
        workoutId: 999,
        exerciseDefinitionId: 10,
      };

      vi.mocked(addExerciseToWorkout).mockResolvedValue(null);

      const result = await addExerciseAction(input);

      expect(result).toEqual({
        success: false,
        error: "Workout not found or unauthorized",
      });
    });

    it("should return error when user not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const input: AddExerciseInput = {
        workoutId: mockWorkoutId,
        exerciseDefinitionId: 10,
      };

      const result = await addExerciseAction(input);

      expect(result).toEqual({
        success: false,
        error: "Unauthorized",
      });
    });
  });

  describe("removeExerciseAction", () => {
    it("should remove exercise from workout", async () => {
      const input: RemoveExerciseInput = {
        workoutId: mockWorkoutId,
        workoutExerciseId: 5,
      };

      vi.mocked(removeExerciseFromWorkout).mockResolvedValue(true);

      const result = await removeExerciseAction(input);

      expect(result).toEqual({
        success: true,
        redirectUrl: `/dashboard/workout/${mockWorkoutId}`,
      });
      expect(removeExerciseFromWorkout).toHaveBeenCalledWith(
        5,
        mockWorkoutId,
        mockUserId
      );
      expect(revalidatePath).toHaveBeenCalledWith(
        `/dashboard/workout/${mockWorkoutId}`
      );
    });

    it("should return error when exercise not found", async () => {
      const input: RemoveExerciseInput = {
        workoutId: mockWorkoutId,
        workoutExerciseId: 999,
      };

      vi.mocked(removeExerciseFromWorkout).mockResolvedValue(false);

      const result = await removeExerciseAction(input);

      expect(result).toEqual({
        success: false,
        error: "Exercise not found or unauthorized",
      });
    });

    it("should return error when user not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const input: RemoveExerciseInput = {
        workoutId: mockWorkoutId,
        workoutExerciseId: 5,
      };

      const result = await removeExerciseAction(input);

      expect(result).toEqual({
        success: false,
        error: "Unauthorized",
      });
    });
  });

  describe("addSetAction", () => {
    it("should add set to exercise", async () => {
      const input: AddSetInput = {
        workoutId: mockWorkoutId,
        workoutExerciseId: 5,
        reps: 10,
        weightLbs: 135,
      };

      const mockSet = {
        id: 1,
        workoutExerciseId: 5,
        order: 0,
        reps: 10,
        weightLbs: "135",
        createdAt: new Date(),
      };

      vi.mocked(addSetToExercise).mockResolvedValue(mockSet as any);

      const result = await addSetAction(input);

      expect(result).toEqual({
        success: true,
        redirectUrl: `/dashboard/workout/${mockWorkoutId}`,
      });
      expect(addSetToExercise).toHaveBeenCalledWith(
        5,
        mockWorkoutId,
        { reps: 10, weightLbs: 135 },
        mockUserId
      );
      expect(revalidatePath).toHaveBeenCalledWith(
        `/dashboard/workout/${mockWorkoutId}`
      );
    });

    it("should add set without weight", async () => {
      const input: AddSetInput = {
        workoutId: mockWorkoutId,
        workoutExerciseId: 5,
        reps: 15,
      };

      const mockSet = {
        id: 1,
        workoutExerciseId: 5,
        order: 0,
        reps: 15,
        weightLbs: null,
        createdAt: new Date(),
      };

      vi.mocked(addSetToExercise).mockResolvedValue(mockSet as any);

      const result = await addSetAction(input);

      expect(result.success).toBe(true);
      expect(addSetToExercise).toHaveBeenCalledWith(
        5,
        mockWorkoutId,
        { reps: 15, weightLbs: undefined },
        mockUserId
      );
    });

    it("should validate reps minimum value", async () => {
      const input: AddSetInput = {
        workoutId: mockWorkoutId,
        workoutExerciseId: 5,
        reps: 0,
      };

      const result = await addSetAction(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Validation failed");
    });

    it("should validate reps maximum value", async () => {
      const input: AddSetInput = {
        workoutId: mockWorkoutId,
        workoutExerciseId: 5,
        reps: 1000,
      };

      const result = await addSetAction(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Validation failed");
    });

    it("should validate weight cannot be negative", async () => {
      const input: AddSetInput = {
        workoutId: mockWorkoutId,
        workoutExerciseId: 5,
        reps: 10,
        weightLbs: -5,
      };

      const result = await addSetAction(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Validation failed");
    });

    it("should return error when exercise not found", async () => {
      const input: AddSetInput = {
        workoutId: mockWorkoutId,
        workoutExerciseId: 999,
        reps: 10,
      };

      vi.mocked(addSetToExercise).mockResolvedValue(null);

      const result = await addSetAction(input);

      expect(result).toEqual({
        success: false,
        error: "Exercise not found or unauthorized",
      });
    });
  });

  describe("updateSetAction", () => {
    it("should update set with valid input", async () => {
      const input: UpdateSetInput = {
        workoutId: mockWorkoutId,
        setId: 10,
        reps: 12,
        weightLbs: 145,
      };

      const mockUpdatedSet = {
        id: 10,
        workoutExerciseId: 5,
        order: 0,
        reps: 12,
        weightLbs: "145",
        createdAt: new Date(),
      };

      vi.mocked(updateSet).mockResolvedValue(mockUpdatedSet as any);

      const result = await updateSetAction(input);

      expect(result).toEqual({
        success: true,
        redirectUrl: `/dashboard/workout/${mockWorkoutId}`,
      });
      expect(updateSet).toHaveBeenCalledWith(
        10,
        mockWorkoutId,
        { reps: 12, weightLbs: 145 },
        mockUserId
      );
      expect(revalidatePath).toHaveBeenCalledWith(
        `/dashboard/workout/${mockWorkoutId}`
      );
    });

    it("should update set without weight", async () => {
      const input: UpdateSetInput = {
        workoutId: mockWorkoutId,
        setId: 10,
        reps: 15,
      };

      const mockUpdatedSet = {
        id: 10,
        workoutExerciseId: 5,
        order: 0,
        reps: 15,
        weightLbs: null,
        createdAt: new Date(),
      };

      vi.mocked(updateSet).mockResolvedValue(mockUpdatedSet as any);

      const result = await updateSetAction(input);

      expect(result.success).toBe(true);
      expect(updateSet).toHaveBeenCalledWith(
        10,
        mockWorkoutId,
        { reps: 15, weightLbs: undefined },
        mockUserId
      );
    });

    it("should return error when set not found", async () => {
      const input: UpdateSetInput = {
        workoutId: mockWorkoutId,
        setId: 999,
        reps: 10,
      };

      vi.mocked(updateSet).mockResolvedValue(null);

      const result = await updateSetAction(input);

      expect(result).toEqual({
        success: false,
        error: "Set not found or unauthorized",
      });
    });

    it("should validate reps constraints", async () => {
      const input: UpdateSetInput = {
        workoutId: mockWorkoutId,
        setId: 10,
        reps: 0,
      };

      const result = await updateSetAction(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Validation failed");
    });
  });

  describe("deleteSetAction", () => {
    it("should delete set successfully", async () => {
      const input: DeleteSetInput = {
        workoutId: mockWorkoutId,
        setId: 10,
      };

      vi.mocked(deleteSet).mockResolvedValue(true);

      const result = await deleteSetAction(input);

      expect(result).toEqual({
        success: true,
        redirectUrl: `/dashboard/workout/${mockWorkoutId}`,
      });
      expect(deleteSet).toHaveBeenCalledWith(10, mockWorkoutId, mockUserId);
      expect(revalidatePath).toHaveBeenCalledWith(
        `/dashboard/workout/${mockWorkoutId}`
      );
    });

    it("should return error when set not found", async () => {
      const input: DeleteSetInput = {
        workoutId: mockWorkoutId,
        setId: 999,
      };

      vi.mocked(deleteSet).mockResolvedValue(false);

      const result = await deleteSetAction(input);

      expect(result).toEqual({
        success: false,
        error: "Set not found or unauthorized",
      });
    });

    it("should return error when user not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const input: DeleteSetInput = {
        workoutId: mockWorkoutId,
        setId: 10,
      };

      const result = await deleteSetAction(input);

      expect(result).toEqual({
        success: false,
        error: "Unauthorized",
      });
    });
  });
});
