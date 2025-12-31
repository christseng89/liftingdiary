# Testing Guide

This project uses **Vitest** and **React Testing Library** for comprehensive unit and integration testing.

## Test Structure

All test files are centralized in the `/test` directory for better organization and maintainability:

```
liftingdiary/
├── data/                            # Source code
│   ├── workouts.ts
│   ├── exercises.ts
│   └── sets.ts
├── app/                             # Next.js app directory
│   └── dashboard/
│       └── workout/
│           ├── new/
│           │   └── actions.ts
│           └── [workoutId]/
│               └── actions.ts
├── components/                      # React components
│   ├── dashboard/
│   │   └── date-picker.tsx
│   └── layout/
│       └── theme-toggle.tsx
└── test/                            # ⭐ All tests live here
    ├── setup.ts                     # Global test setup and mocks
    ├── README.md                    # This file
    ├── data/                        # Data layer tests
    │   ├── workouts.test.ts         # Workout CRUD tests
    │   ├── exercises.test.ts        # Exercise management tests
    │   └── sets.test.ts             # Set tracking tests
    ├── actions/                     # Server Actions tests
    │   ├── create-workout.test.ts   # Workout creation tests
    │   └── workout-operations.test.ts # All workout operations tests
    └── components/                  # UI Component tests
        ├── date-picker.test.tsx     # Date picker tests
        └── theme-toggle.test.tsx    # Theme toggle tests
```

## Running Tests

### Run all tests (watch mode)
```bash
npm test
```

### Run tests once (CI mode)
```bash
npm test -- --run
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage report
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- test/data/workouts.test.ts
```

### Run tests matching a pattern
```bash
npm test -- --grep "createWorkout"
```

## Test Categories

### 1. Data Layer Tests (`test/data/*.test.ts`)

Test database query and mutation functions with mocked database:

- **test/data/workouts.test.ts**: Tests for workout CRUD operations
  - ✅ Fetching workouts by user and date
  - ✅ Fetching single workout by ID
  - ✅ Creating workouts
  - ✅ Updating workouts
  - ✅ Security: userId ownership verification

- **test/data/exercises.test.ts**: Tests for exercise operations
  - ✅ Fetching exercise definitions
  - ✅ Adding exercises to workouts
  - ✅ Removing exercises from workouts
  - ✅ Exercise ordering logic
  - ✅ Security: workout ownership verification

- **test/data/sets.test.ts**: Tests for set operations
  - ✅ Adding sets to exercises
  - ✅ Updating sets
  - ✅ Deleting sets
  - ✅ Set ordering logic
  - ✅ Security: multi-level ownership verification

### 2. Server Actions Tests (`test/actions/*.test.ts`)

Test Next.js Server Actions with mocked dependencies:

- **test/actions/create-workout.test.ts**: Tests for workout creation
  - ✅ Valid workout creation
  - ✅ Zod validation (name, notes, dates)
  - ✅ Authentication checks
  - ✅ Redirect URL generation
  - ✅ Error handling

- **test/actions/workout-operations.test.ts**: Tests for all workout operations
  - ✅ Update workout action
  - ✅ Add/remove exercise actions
  - ✅ Add/update/delete set actions
  - ✅ Zod validation for all inputs
  - ✅ Date validation (completedAt > startedAt)
  - ✅ Authentication and authorization
  - ✅ Error handling

### 3. UI Component Tests (`test/components/*.test.tsx`)

Test React components with React Testing Library:

- **test/components/date-picker.test.tsx**: Tests for date picker component
  - ✅ Date formatting with date-fns
  - ✅ URL parameter updates
  - ✅ Popover interactions
  - ✅ Search params preservation
  - ✅ Accessibility

- **test/components/theme-toggle.test.tsx**: Tests for theme toggle component
  - ✅ Theme switching (light/dark/system)
  - ✅ Mount/hydration handling
  - ✅ Dropdown menu interactions
  - ✅ Icon rendering
  - ✅ Accessibility

## Test Configuration

### `vitest.config.ts`

- **Environment**: jsdom (for DOM testing)
- **Globals**: Enabled (no need to import describe, it, expect)
- **Setup**: `test/setup.ts` runs before all tests
- **Path aliases**: `@/*` resolves correctly
- **Coverage**: Excludes node_modules, .next, test files, config files, and shadcn/ui components

### `test/setup.ts`

Global mocks and configuration:

1. **React Testing Library**: Auto-cleanup after each test
2. **Next.js Router**: Mocked `useRouter`, `useSearchParams`, `usePathname`
3. **Clerk Auth**: Mocked `auth()`, `useUser()`, and auth components
4. **Next.js Cache**: Mocked `revalidatePath`, `revalidateTag`

## Writing Tests

### Example: Data Layer Test

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getWorkoutById } from "./workouts";
import { db } from "@/db";

vi.mock("@/db");

describe("getWorkoutById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch workout by id", async () => {
    const mockWorkout = { id: 1, name: "Test", userId: "user-123" };
    vi.mocked(db.query.workouts.findFirst).mockResolvedValue(mockWorkout);

    const result = await getWorkoutById(1, "user-123");

    expect(result).toEqual(mockWorkout);
  });
});
```

### Example: Server Action Test

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createWorkoutAction } from "./actions";
import { auth } from "@clerk/nextjs/server";

vi.mock("@clerk/nextjs/server");

describe("createWorkoutAction", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue({ userId: "test-user" } as any);
  });

  it("should create workout", async () => {
    const result = await createWorkoutAction({ name: "Test" });
    expect(result.success).toBe(true);
  });
});
```

### Example: Component Test

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DatePicker } from "./date-picker";

describe("DatePicker", () => {
  it("should render with date", () => {
    render(<DatePicker selectedDate={new Date("2025-01-15")} />);
    expect(screen.getByText("15th Jan 2025")).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Clear Test Names**: Use descriptive test names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and assertion phases
3. **Mock External Dependencies**: Mock database, API calls, and external libraries
4. **Test Security**: Verify userId ownership checks in all data operations
5. **Test Validation**: Verify Zod validation rules for all Server Actions
6. **Test Error Cases**: Include tests for error scenarios and edge cases
7. **Cleanup**: Use `beforeEach` to clear mocks between tests
8. **Accessibility**: Test for accessible labels and ARIA attributes in components

## Coverage Goals

Target coverage metrics:

- **Data Layer**: 90%+ coverage (critical for security)
- **Server Actions**: 85%+ coverage (validation and auth are critical)
- **UI Components**: 70%+ coverage (focus on logic and interactions)
- **Overall**: 80%+ coverage

## Continuous Integration

Tests run automatically in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test -- --run --coverage
```

## Troubleshooting

### Mock Issues

If mocks aren't working:
1. Check that mock is declared before import
2. Use `vi.clearAllMocks()` in `beforeEach`
3. Verify mock path matches actual import path

### Type Errors

If TypeScript complains about mocks:
```typescript
vi.mocked(functionName).mockResolvedValue(value as any);
```

### Async Issues

Always use `async/await` or return promises:
```typescript
it("should handle async", async () => {
  await someAsyncFunction();
  expect(result).toBe(expected);
});
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing/vitest)
