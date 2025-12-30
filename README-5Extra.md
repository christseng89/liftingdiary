# Extras

```claude
Create a plan on how to implement logging exercises and sets for a particular workout for the /dashboard/workout/{workoutId} page.

/clear

To edit an exercise, use a button instead of direct editing.

/clear

Do NOT set default values for new set inputs. Leave them blank for the user to fill in.

/clear

Refactor the “sets list” UI to use a fixed header row with column titles:
Set | Reps | Weight (lbs) | Actions.

Requirements:
- Render a header row once at the top.
- Each data row should display only numeric values (e.g., 1, 30, 185) with no extra text like “reps” or “lbs”.
- The “Actions” column should contain only Edit and Delete icon buttons aligned to the right.
- Use a shadcn/ui <Table> component for displaying sets, if possible.

/clear
```
