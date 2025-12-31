import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock database to prevent connection attempts
vi.mock("@/db", () => ({
  db: {
    query: {
      workouts: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      exerciseDefinitions: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      workoutExercises: {
        findMany: vi.fn(),
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

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(() => "/"),
}));

// Mock Clerk authentication
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(() => Promise.resolve({ userId: "test-user-123" })),
  currentUser: vi.fn(() => Promise.resolve({ id: "test-user-123" })),
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: vi.fn(() => ({
    user: { id: "test-user-123" },
    isLoaded: true,
    isSignedIn: true,
  })),
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
  SignUpButton: ({ children }: { children: React.ReactNode }) => children,
  UserButton: () => null,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
}));

// Mock Next.js cache functions
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
    systemTheme: "light",
  })),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
