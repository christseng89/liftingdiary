# Github Actions Integration

```claude
/merge-and-create-branch main github-actions
```

## Vercel Integration

<https://vercel.com/chris-tsengs-projects>

**Add New** -> Project -> Import Git Repository (**liftingdiary**) -> **Import**
-> **Environment Variables** -> **Import .env** -> **Deploy** -> **Continue to Dashboard**

Domains
<[liftingdiary-ecru.vercel.app](https://liftingdiary-ecru.vercel.app/)>

## Github Actions

```claude
/install-github-actions
  Use current repository
    Click "Install" in the Browser -> Only select "liftingdiary" repo -> "Install & Authorize"
```

```Github in Browser
Create pull request -> Merge pull request -> **Code** (.github/workflows) -> **Issues**
```

```bash
git pull

#  .github/workflows/claude-code-review.yml | 57 ++++++++++++++++++++++++++++++++
#  .github/workflows/claude.yml             | 50 ++++++++++++++++++++++++++++
#  2 files changed, 107 insertions(+)
#  create mode 100644 .github/workflows/claude-code-review.yml
#  create mode 100644 .github/workflows/claude.yml
```

## Automate GitHub issue fixing with Claude Code GitHub Action

```GitHub -> Issues -> New issue
If a user is logged in and trying to access the main homepage, then auto-redirect them to the /dashboard page.

-> Create

**Add a comment** 
  @claude implement this.

**Test it out Vercel deployment**
  Go to <https://liftingdiary-ecru.vercel.app/> and sign in.
  You should be redirected to <https://liftingdiary-ecru.vercel.app/dashboard>.

** Github **
Create pull request -> Merge pull request -> Confirm merge

```

```bash
git pull

# From https://github.com/christseng89/liftingdiary
#    ca1aeae..3e4c4cf  main       -> origin/main
# Updating ca1aeae..3e4c4cf
# Fast-forward
#  app/page.tsx | 10 +++++++++-
#  1 file changed, 9 insertions(+), 1 deletion(-)
```

## Automate GitHub issue fixing with Claude Code GitHub Actions

```GitHub -> Issues -> New issue
Title: Use shadcn UI buttons for the sign-in and sign-up buttons.
Description: Currently these buttons are rendering as button tags styled with Tailwind CSS, but they should be rendering as shadcn UI buttons instead.

-> Create -> @claude fix this issue -> Comment

```

```GitHub -> Issues -> New issue
Title: Update the app to automatically follow the user’s Windows system color mode (light/dark) using the OS preference instead of a hardcoded theme.
Description: The app currently uses a hardcoded light theme. Update it to use the user’s Windows system color mode preference (light/dark) automatically.

Add a comment
  @claude implement this.

```

```GitHub -> Issues -> New issue
Title: Make the workouts clickable on the /dashboard page.
Description: Each workout must be a link that navigates the user to /dashboard/workout/[workoutId]

Title: Using the calendar in the dashboard, when a user clicks a date, load and display the workouts for that selected date, and immediately close (disable) the calendar popup.
```

```bash
git pull
```
