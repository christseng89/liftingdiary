# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lifting Diary is a Next.js 16.1.0 application using the App Router pattern with TypeScript, React 19, and Tailwind CSS v4. This is currently a fresh starter template with foundational setup complete, but lifting diary-specific features have not been implemented yet.

## Development Commands

```bash
# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Run ESLint
npm run lint
```

## Technology Stack

- **Framework**: Next.js 16.1.0 (App Router)
- **Language**: TypeScript 5 (strict mode enabled)
- **React**: 19.2.3
- **Styling**: Tailwind CSS v4 with PostCSS
- **Linting**: ESLint 9 with Next.js config (flat config format)
- **Fonts**: Geist Sans and Geist Mono (auto-optimized via next/font)

## TypeScript Configuration

- **Strict mode**: Enabled (`"strict": true`)
- **Path aliases**: `@/*` maps to project root (e.g., `import Button from "@/components/Button"`)
- **Module resolution**: "bundler" mode
- **Target**: ES2017
- **JSX**: react-jsx (no need to import React in component files)
- **No emit**: TypeScript only type-checks, Next.js handles compilation

## Project Architecture

### App Router Structure

```
app/
├── layout.tsx         # Root layout with font configuration and metadata
├── page.tsx           # Home page (currently boilerplate)
├── globals.css        # Global styles with Tailwind imports and theme config
└── favicon.ico        # Site favicon
```

### Current State

This is a greenfield project. The following do not exist yet:
- Custom components (no `components/` directory)
- Custom hooks (no `lib/hooks/` directory)
- Utilities (no `lib/utils/` directory)
- Data models/types (no domain-specific types)
- API routes (no `app/api/` directory)
- Server actions (no `app/actions/` directory)
- Database configuration

### Root Layout (`app/layout.tsx`)

- Configures Geist Sans and Geist Mono fonts via `next/font/google`
- Sets CSS variables: `--font-geist-sans` and `--font-geist-mono`
- Exports `metadata` object for SEO (currently placeholder values)
- Wraps all pages with `<html>` and `<body>` tags

### Styling System (`app/globals.css`)

- Uses Tailwind CSS v4 with `@import "tailwindcss"` directive
- Theme configured inline via `@theme inline` block:
  - `--color-background` and `--color-foreground` for theming
  - Font families linked to CSS variables from layout
- Dark mode support via `prefers-color-scheme: dark` media query
- CSS custom properties for light/dark theme colors

## ESLint Configuration

Uses ESLint 9 flat config format:
- Extends `eslint-config-next/core-web-vitals` for Core Web Vitals best practices
- Extends `eslint-config-next/typescript` for TypeScript-specific rules
- Ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`

## Recommended Architecture for Future Development

When implementing lifting diary features, follow this structure:

```
app/
├── (auth)/                 # Route group for authentication pages
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/            # Route group for protected routes
│   ├── layout.tsx          # Dashboard-specific layout
│   ├── workouts/
│   │   ├── page.tsx        # List view
│   │   ├── [id]/page.tsx   # Detail view
│   │   └── new/page.tsx    # Create view
│   ├── exercises/
│   └── progress/
├── actions/                # Server actions for mutations
│   ├── workouts.ts
│   └── exercises.ts
├── api/                    # REST API routes (if needed for external clients)
│   └── [resource]/route.ts
├── layout.tsx
└── page.tsx

lib/
├── types/                  # TypeScript type definitions
│   ├── workout.ts
│   └── exercise.ts
├── hooks/                  # Custom React hooks
│   └── useWorkouts.ts
├── utils/                  # Utility functions
│   └── calculations.ts
└── db.ts                   # Database configuration (Prisma/Drizzle)

components/
├── ui/                     # Reusable UI components (buttons, inputs, etc.)
├── workout/                # Workout-specific components
├── exercise/               # Exercise-specific components
└── nav/                    # Navigation components
```

### Architectural Patterns

1. **Server Components by Default**: All components in `app/` are Server Components unless marked with `"use client"`
2. **Server Actions**: Prefer Server Actions over API routes for form mutations and data operations
3. **API Routes**: Use only when needed for external integrations or webhooks
4. **Colocation**: Keep related components, hooks, and utilities close to where they're used
5. **Route Groups**: Use `(group)` syntax for logical organization without affecting URL structure

## Development Guidelines

### Component Patterns

- Use Server Components for data fetching and static content
- Use Client Components (`"use client"`) only when needed for:
  - Event handlers (onClick, onChange, etc.)
  - React hooks (useState, useEffect, etc.)
  - Browser APIs (localStorage, window, etc.)

### Data Fetching

- Fetch data directly in Server Components using async/await
- Use React Suspense for loading states
- Leverage Next.js automatic request deduplication

### Styling

- Use Tailwind utility classes for styling
- Access theme colors via `bg-background`, `text-foreground` classes
- Custom fonts available via `font-sans` and `font-mono` classes
- Dark mode automatically handled via `prefers-color-scheme`

### Type Safety

- All code must type-check with strict mode
- Use `@/*` path aliases for cleaner imports
- Prefer interface over type for object shapes
- Export types from dedicated `lib/types/` directory

### Database Considerations

When adding database support:
- Consider Prisma with PostgreSQL for type-safe ORM
- Or Drizzle ORM for lightweight, performant alternative
- Or Supabase for rapid development with auth included
- Place schema/client in `lib/db.ts` or `lib/db/` directory
