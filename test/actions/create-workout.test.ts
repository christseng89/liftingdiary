import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createWorkoutAction,
  type CreateWorkoutInput,
} from "@/app/dashboard/workout/new/actions";
import { createWorkout } from "@/data/workouts";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Mock dependencies
vi.mock("@/data/workouts");
vi.mock("@clerk/nextjs/server");
vi.mock("next/cache");

describe("createWorkoutAction", () => {
  const mockUserId = "test-user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
  });

  it("should create workout with valid input", async () => {
    const input: CreateWorkoutInput = {
      name: "Morning Workout",
      startedAt: new Date("2025-01-15T09:00:00Z"),
      notes: "Test workout",
    };

    const mockWorkout = {
      id: 1,
      name: input.name,
      startedAt: input.startedAt,
      notes: input.notes,
      userId: mockUserId,
      completedAt: null,
      createdAt: new Date(),
    };

    vi.mocked(createWorkout).mockResolvedValue(mockWorkout as any);

    const result = await createWorkoutAction(input);

    expect(result).toEqual({
      success: true,
      redirectUrl: "/dashboard",
    });
    expect(createWorkout).toHaveBeenCalledWith(
      {
        name: input.name,
        startedAt: input.startedAt,
        notes: input.notes,
      },
      mockUserId
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("should create workout with minimal input", async () => {
    const input: CreateWorkoutInput = {
      name: "Quick Workout",
    };

    const mockWorkout = {
      id: 1,
      name: input.name,
      startedAt: new Date(),
      notes: null,
      userId: mockUserId,
      completedAt: null,
      createdAt: new Date(),
    };

    vi.mocked(createWorkout).mockResolvedValue(mockWorkout as any);

    const result = await createWorkoutAction(input);

    expect(result.success).toBe(true);
    expect(createWorkout).toHaveBeenCalledWith(
      {
        name: input.name,
      },
      mockUserId
    );
  });

  it("should redirect to dashboard with date parameter when redirectDate provided", async () => {
    const input: CreateWorkoutInput = {
      name: "Test Workout",
      redirectDate: "2025-01-15",
    };

    const mockWorkout = {
      id: 1,
      name: input.name,
      startedAt: new Date(),
      notes: null,
      userId: mockUserId,
      completedAt: null,
      createdAt: new Date(),
    };

    vi.mocked(createWorkout).mockResolvedValue(mockWorkout as any);

    const result = await createWorkoutAction(input);

    expect(result).toEqual({
      success: true,
      redirectUrl: "/dashboard?date=2025-01-15",
    });
  });

  it("should return error when user not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any);

    const input: CreateWorkoutInput = {
      name: "Test Workout",
    };

    const result = await createWorkoutAction(input);

    expect(result).toEqual({
      success: false,
      error: "Unauthorized",
    });
    expect(createWorkout).not.toHaveBeenCalled();
  });

  it("should return validation error when name is empty", async () => {
    const input: CreateWorkoutInput = {
      name: "",
    };

    const result = await createWorkoutAction(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Validation failed");
    expect(result.issues).toBeDefined();
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["name"],
        }),
      ])
    );
  });

  it("should return validation error when name is too long", async () => {
    const input: CreateWorkoutInput = {
      name: "a".repeat(256),
    };

    const result = await createWorkoutAction(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Validation failed");
    expect(result.issues).toBeDefined();
  });

  it("should return validation error when notes are too long", async () => {
    const input: CreateWorkoutInput = {
      name: "Test Workout",
      notes: "a".repeat(1001),
    };

    const result = await createWorkoutAction(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Validation failed");
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["notes"],
        }),
      ])
    );
  });

  it("should handle unexpected errors gracefully", async () => {
    const input: CreateWorkoutInput = {
      name: "Test Workout",
    };

    vi.mocked(createWorkout).mockRejectedValue(
      new Error("Database connection failed")
    );

    const result = await createWorkoutAction(input);

    expect(result).toEqual({
      success: false,
      error: "Failed to create workout. Please try again.",
    });
  });

  it("should not pass redirectDate to createWorkout", async () => {
    const input: CreateWorkoutInput = {
      name: "Test Workout",
      redirectDate: "2025-01-15",
    };

    const mockWorkout = {
      id: 1,
      name: input.name,
      startedAt: new Date(),
      notes: null,
      userId: mockUserId,
      completedAt: null,
      createdAt: new Date(),
    };

    vi.mocked(createWorkout).mockResolvedValue(mockWorkout as any);

    await createWorkoutAction(input);

    expect(createWorkout).toHaveBeenCalledWith(
      {
        name: input.name,
      },
      mockUserId
    );
    // Verify redirectDate is not included in the call
    expect(createWorkout).not.toHaveBeenCalledWith(
      expect.objectContaining({
        redirectDate: expect.anything(),
      }),
      expect.anything()
    );
  });

  it("should accept optional startedAt date", async () => {
    const startedAt = new Date("2025-01-15T14:30:00Z");
    const input: CreateWorkoutInput = {
      name: "Afternoon Workout",
      startedAt,
    };

    const mockWorkout = {
      id: 1,
      name: input.name,
      startedAt,
      notes: null,
      userId: mockUserId,
      completedAt: null,
      createdAt: new Date(),
    };

    vi.mocked(createWorkout).mockResolvedValue(mockWorkout as any);

    const result = await createWorkoutAction(input);

    expect(result.success).toBe(true);
    expect(createWorkout).toHaveBeenCalledWith(
      expect.objectContaining({
        startedAt,
      }),
      mockUserId
    );
  });
});
