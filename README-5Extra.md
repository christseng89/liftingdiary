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

For the Add Set feature:
- Do NOT display the empty-state message “No sets recorded yet. Add your first set below.”
- Do NOT display placeholder text in the Reps and Weight (lbs) input fields.

/clear

```

## Personal v projects custom slash commands

```bash
# Personal slash commands for project management
mkdir -p $HOME/.claude/commands
cd $HOME/.claude/commands && code .

```

```auto-commit.md
Generate a commit message based on the changes within the current branch. The commit message must be short and to-the-point and provide a summary of the changes. Then commit those changes to the current git branch.
```

```bash
claude
  /auto-commit

    # /auto-commit            Generate a commit message based on the changes within the current branch. The commit   
    #                         message must... (**user**)
    # /auto-commit            Generate a commit message based on the changes within the current branch. The commit   
    #                         message must... (**project**)

/clear
```

```bash
mkdir -p $HOME/.claude/commands/personal
cd $HOME/.claude/commands
# cp ../auto-commit.md .
mv ./auto-commit.md ./personal/

/auto-commit

#   /auto-commit              Generate a commit message based on the changes within the current branch. The        
#                             commit message must... (project)
#   /personal:auto-commit     This is the user-scope command.  Generate a commit message based on the changes      
#                             within the curren... (user)
```
