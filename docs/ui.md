# UI Coding Standards

This document defines the UI coding standards and guidelines for the Lifting Diary project.

## UI Component Library

### shadcn/ui - Exclusive Component Library

**IMPORTANT**: This project uses [shadcn/ui](https://ui.shadcn.com/) exclusively for all UI components.

**Rules**:
- ✅ **DO**: Use shadcn/ui components for all UI needs
- ❌ **DO NOT**: Create custom UI components (buttons, inputs, cards, dialogs, etc.)
- ❌ **DO NOT**: Use other component libraries (Material-UI, Chakra UI, etc.)

### Installing shadcn/ui Components

When you need a new UI component:

```bash
npx shadcn@latest add [component-name]
```

Examples:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add form
```

### Available Components

Refer to the [shadcn/ui documentation](https://ui.shadcn.com/docs/components) for the full list of available components including:
- Buttons, Inputs, Textareas
- Cards, Dialogs, Modals
- Forms, Select dropdowns
- Tables, Data tables
- Navigation menus
- Alerts, Toasts
- And many more...

## Date Formatting

### date-fns - Date Formatting Library

**IMPORTANT**: All date formatting in this project must use [date-fns](https://date-fns.org/).

### Standard Date Format

All dates displayed in the UI must follow this format:

```
1st Sep 2025
2nd Aug 2025
3rd Jan 2026
4th Jun 2024
```

**Format pattern**: `do MMM yyyy`

### Implementation

```typescript
import { format } from 'date-fns';

// Format a date
const formattedDate = format(new Date('2025-09-01'), 'do MMM yyyy');
// Output: "1st Sep 2025"
```

### Examples

```typescript
import { format } from 'date-fns';

// Example dates
format(new Date('2025-09-01'), 'do MMM yyyy'); // "1st Sep 2025"
format(new Date('2025-08-02'), 'do MMM yyyy'); // "2nd Aug 2025"
format(new Date('2026-01-03'), 'do MMM yyyy'); // "3rd Jan 2026"
format(new Date('2024-06-04'), 'do MMM yyyy'); // "4th Jun 2024"
```

### Date Formatting Guidelines

- **DO**: Always use `date-fns` for any date manipulation or formatting
- **DO**: Use the standard format (`do MMM yyyy`) consistently across the app
- **DO NOT**: Use native JavaScript date methods like `toLocaleDateString()`
- **DO NOT**: Use other date libraries (Moment.js, Day.js, etc.)
- **DO NOT**: Manually construct date strings

## General UI Guidelines

### Styling

- Use Tailwind CSS utility classes for all styling
- Follow the design system defined in `app/globals.css`
- Use semantic color tokens: `bg-background`, `text-foreground`, etc.

### Accessibility

- Ensure all UI components are keyboard accessible
- Include proper ARIA labels and roles
- Test with screen readers when possible
- shadcn/ui components come with accessibility built-in

### Responsive Design

- Design mobile-first
- Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Test on multiple screen sizes

### Dark Mode

- The project supports dark mode via `prefers-color-scheme`
- Use Tailwind's dark mode utilities: `dark:bg-slate-900`
- shadcn/ui components automatically support dark mode

## Component Organization

```
components/
├── ui/              # shadcn/ui components only (auto-generated)
├── workout/         # Workout-specific composed components
├── exercise/        # Exercise-specific composed components
└── layout/          # Layout components (headers, footers, etc.)
```

**Note**: The `components/ui/` directory contains only shadcn/ui components. Composed components that combine multiple shadcn/ui components should be placed in feature-specific directories.

## Summary

1. **Use shadcn/ui exclusively** - No custom UI components
2. **Use date-fns for dates** - Format as `do MMM yyyy` (e.g., "1st Sep 2025")
3. **Follow Tailwind CSS** - Use utility classes for styling
4. **Prioritize accessibility** - Leverage shadcn/ui's built-in features
5. **Design responsive** - Mobile-first approach

For questions or clarifications, refer to:
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [date-fns Documentation](https://date-fns.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
