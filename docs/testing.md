# Testing Guide

This document provides comprehensive guidelines for writing and maintaining tests in the Lifting Diary application.

## Testing Stack

- **Test Runner**: Vitest 4.0.16
- **Component Testing**: React Testing Library 16.3.1
- **DOM Assertions**: @testing-library/jest-dom 6.9.1
- **User Interactions**: @testing-library/user-event 14.6.1
- **Test Environment**: jsdom 27.4.0
- **React Plugin**: @vitejs/plugin-react 5.1.2

## Test Structure

All tests are centralized in the `/test` directory:

```
test/
├── setup.ts                           # Global mocks and configuration
├── data/                              # Data layer unit tests
│   ├── workouts.test.ts
│   ├── exercises.test.ts
│   └── sets.test.ts
├── actions/                           # Server Actions tests
│   ├── create-workout.test.ts
│   └── workout-operations.test.ts
└── components/                        # UI component tests
    ├── date-picker.test.tsx
    └── theme-toggle.test.tsx
```

## ✅ Required Patterns

### 1. Data Layer Tests

**Pattern**: Mock database, test query logic and security

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getWorkoutById } from "@/data/workouts";
import { db } from "@/db";

// Mock the database module
vi.mock("@/db", () => ({
  db: {
    query: {
      workouts: {
        findFirst: vi.fn(),
      },
    },
  },
}));

describe("getWorkoutById", () => {
  const mockUserId = "test-user-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch workout with userId verification", async () => {
    const mockWorkout = {
      id: 1,
      name: "Test Workout",
      userId: mockUserId,
    };

    vi.mocked(db.query.workouts.findFirst).mockResolvedValue(mockWorkout);

    const result = await getWorkoutById(1, mockUserId);

    expect(result).toEqual(mockWorkout);
    expect(db.query.workouts.findFirst).toHaveBeenCalled();
  });

  it("should return null when workout not found", async () => {
    vi.mocked(db.query.workouts.findFirst).mockResolvedValue(undefined);

    const result = await getWorkoutById(999, mockUserId);

    expect(result).toBeNull();
  });
});
```

**Key Requirements**:
- ✅ Mock `@/db` in every data layer test
- ✅ Test security (userId ownership verification)
- ✅ Test not found scenarios
- ✅ Clear mocks in `beforeEach`
- ✅ Use descriptive test names

### 2. Server Actions Tests

**Pattern**: Mock dependencies, test validation and auth

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createWorkoutAction } from "@/app/dashboard/workout/new/actions";
import { createWorkout } from "@/data/workouts";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Mock all dependencies
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
    const input = { name: "Test Workout" };

    vi.mocked(createWorkout).mockResolvedValue({
      id: 1,
      name: input.name,
      userId: mockUserId,
      startedAt: new Date(),
      completedAt: null,
      notes: null,
      createdAt: new Date(),
    } as any);

    const result = await createWorkoutAction(input);

    expect(result.success).toBe(true);
    expect(createWorkout).toHaveBeenCalledWith(input, mockUserId);
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("should return error when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any);

    const result = await createWorkoutAction({ name: "Test" });

    expect(result).toEqual({
      success: false,
      error: "Unauthorized",
    });
  });

  it("should validate input with Zod", async () => {
    const result = await createWorkoutAction({ name: "" });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Validation failed");
    expect(result.issues).toBeDefined();
  });
});
```

**Key Requirements**:
- ✅ Mock `@/data/*`, `@clerk/nextjs/server`, `next/cache`
- ✅ Test authentication checks
- ✅ Test Zod validation errors
- ✅ Test successful operations
- ✅ Verify `revalidatePath` calls

### 3. Component Tests

**Pattern**: Test rendering, interactions, and props

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DatePicker } from "@/components/dashboard/date-picker";
import { useRouter, useSearchParams } from "next/navigation";

describe("DatePicker", () => {
  const mockPush = vi.fn();
  const mockToString = vi.fn(() => "");

  beforeEach(() => {
    vi.clearAllMocks();

    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    });

    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn(),
      toString: mockToString,
      has: vi.fn(),
      getAll: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
      entries: vi.fn(),
      forEach: vi.fn(),
    });
  });

  it("should render with formatted date", () => {
    const selectedDate = new Date("2025-01-15");

    render(<DatePicker selectedDate={selectedDate} />);

    expect(screen.getByText("15th Jan 2025")).toBeInTheDocument();
  });

  it("should have accessible button", () => {
    const selectedDate = new Date("2025-01-15");

    render(<DatePicker selectedDate={selectedDate} />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });
});
```

**Key Requirements**:
- ✅ Mock Next.js hooks (`useRouter`, `useSearchParams`)
- ✅ Test component rendering
- ✅ Test accessibility (roles, labels)
- ✅ Use `screen` queries for better debugging
- ✅ Test date formatting with date-fns

## ❌ Anti-Patterns

### 1. Don't Test Implementation Details

```typescript
// ❌ BAD - Testing internal state
it("should set loading to true", () => {
  const { result } = renderHook(() => useWorkouts());
  expect(result.current.loading).toBe(true);
});

// ✅ GOOD - Test behavior
it("should display loading indicator", () => {
  render(<WorkoutList />);
  expect(screen.getByText("Loading...")).toBeInTheDocument();
});
```

### 2. Don't Skip Security Tests

```typescript
// ❌ BAD - No userId verification
it("should fetch workout", async () => {
  const result = await getWorkoutById(1);
  expect(result).toBeDefined();
});

// ✅ GOOD - Test security
it("should verify userId ownership", async () => {
  await getWorkoutById(1, "user-123");

  expect(db.query.workouts.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.any(Function),
    })
  );
});
```

### 3. Don't Use Relative Imports in Tests

```typescript
// ❌ BAD - Relative imports
import { createWorkout } from "../../../data/workouts";

// ✅ GOOD - Use @ alias
import { createWorkout } from "@/data/workouts";
```

### 4. Don't Forget to Clear Mocks

```typescript
// ❌ BAD - Mocks carry over between tests
describe("myTests", () => {
  it("test 1", () => {
    vi.mocked(myFunction).mockReturnValue("value");
  });

  it("test 2", () => {
    // Oops, still has mock from test 1
  });
});

// ✅ GOOD - Clear mocks
describe("myTests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("test 1", () => {
    vi.mocked(myFunction).mockReturnValue("value");
  });

  it("test 2", () => {
    // Clean slate
  });
});
```

## 🔒 Security Testing Requirements

Every data layer function MUST test userId ownership:

```typescript
describe("updateWorkout", () => {
  it("should verify userId in WHERE clause", async () => {
    const mockUpdate = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };

    vi.mocked(db.update).mockReturnValue(mockUpdate as any);

    await updateWorkout(1, { name: "Updated" }, "user-123");

    expect(mockUpdate.where).toHaveBeenCalled();
  });

  it("should return null when unauthorized", async () => {
    const mockUpdate = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };

    vi.mocked(db.update).mockReturnValue(mockUpdate as any);

    const result = await updateWorkout(1, { name: "Updated" }, "wrong-user");

    expect(result).toBeNull();
  });
});
```

## 📝 Test Naming Convention

Use descriptive names that explain what is being tested:

```typescript
// ✅ GOOD - Clear and descriptive
it("should create workout with valid input", async () => {});
it("should return error when user not authenticated", async () => {});
it("should validate reps must be at least 1", async () => {});

// ❌ BAD - Vague
it("works", async () => {});
it("test create", async () => {});
it("should work correctly", async () => {});
```

## 🔧 Test Setup (test/setup.ts)

Global mocks are configured in `test/setup.ts`:

```typescript
import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock database
vi.mock("@/db", () => ({
  db: {
    query: { /* ... */ },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(() => "/"),
}));

// Mock Clerk authentication
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(() => Promise.resolve({ userId: "test-user-123" })),
}));

// Mock Next.js cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({
    theme: "light",
    setTheme: vi.fn(),
    themes: ["light", "dark", "system"],
  })),
}));
```

## ⚠️ Common Mistakes

### 1. Not Awaiting Async Functions

```typescript
// ❌ BAD
it("should create workout", () => {
  const result = createWorkout({ name: "Test" }, "user-123");
  expect(result).toBeDefined();
});

// ✅ GOOD
it("should create workout", async () => {
  const result = await createWorkout({ name: "Test" }, "user-123");
  expect(result).toBeDefined();
});
```

### 2. Using fireEvent Instead of userEvent

```typescript
// ❌ BAD - fireEvent doesn't simulate real user interactions
import { fireEvent } from "@testing-library/react";
fireEvent.click(button);

// ✅ GOOD - userEvent simulates real interactions (for complex scenarios)
import userEvent from "@testing-library/user-event";
await userEvent.click(button);
```

### 3. Testing Multiple Things in One Test

```typescript
// ❌ BAD
it("should work", async () => {
  const result1 = await createWorkout();
  expect(result1).toBeDefined();

  const result2 = await updateWorkout();
  expect(result2).toBeDefined();

  const result3 = await deleteWorkout();
  expect(result3).toBe(true);
});

// ✅ GOOD - One assertion per test
it("should create workout", async () => {
  const result = await createWorkout();
  expect(result).toBeDefined();
});

it("should update workout", async () => {
  const result = await updateWorkout();
  expect(result).toBeDefined();
});

it("should delete workout", async () => {
  const result = await deleteWorkout();
  expect(result).toBe(true);
});
```

## 📊 Coverage Requirements

Maintain these coverage thresholds:

- **Data Layer**: ≥90% (security is critical)
- **Server Actions**: ≥85% (validation is critical)
- **Components**: ≥70% (focus on user-facing logic)
- **Overall**: ≥80%

Check coverage:

```bash
npm run test:coverage
```

## 🚀 Running Tests

```bash
# Run all tests (watch mode)
npm test

# Run tests once (CI mode)
npm test -- --run

# Run specific test file
npm test -- test/data/workouts.test.ts

# Run specific test suite
npm test -- test/data
npm test -- test/actions
npm test -- test/components

# Run with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## 📚 Additional Resources

- **Test Guide**: `/test/README.md` - Detailed testing guide
- **Test Structure**: `/test/TEST_STRUCTURE.md` - Directory organization
- **Test Summary**: `/TEST_SUMMARY.md` - Test suite overview
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## ✅ Testing Checklist

Before committing code, ensure:

- [ ] All tests pass (`npm test -- --run`)
- [ ] New features have tests
- [ ] Security checks are tested (userId verification)
- [ ] Validation errors are tested
- [ ] Edge cases are covered
- [ ] Coverage meets thresholds
- [ ] Test names are descriptive
- [ ] Mocks are properly configured
- [ ] No implementation details tested
- [ ] Accessibility is tested (components)

## 🎯 Test-Driven Development (TDD)

When adding new features, follow TDD:

1. **Write the test first** (it should fail)
2. **Write minimal code** to make it pass
3. **Refactor** while keeping tests green
4. **Repeat** for each requirement

Example workflow:

```typescript
// 1. Write failing test
it("should validate workout name is required", async () => {
  const result = await createWorkoutAction({ name: "" });
  expect(result.success).toBe(false);
  expect(result.error).toBe("Validation failed");
});

// 2. Implement validation
const schema = z.object({
  name: z.string().min(1, "Workout name is required"),
});

// 3. Test passes ✅

// 4. Refactor if needed
```

## Summary

- ✅ Test security (userId verification) in all data operations
- ✅ Test Zod validation in all Server Actions
- ✅ Mock external dependencies (database, auth, router)
- ✅ Use descriptive test names
- ✅ Test error cases and edge cases
- ✅ Maintain coverage thresholds
- ✅ Clear mocks between tests
- ✅ Test accessibility in components
- ❌ Don't test implementation details
- ❌ Don't skip security tests
- ❌ Don't use relative imports
