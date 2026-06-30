# GraphQL Profile

Student profile dashboard for the GraphQL audit project.

Live site:

```text
https://protector01.github.io/graphql/
```

GitHub repository:

```text
https://github.com/ProTecTor01/graphql
```

## What It Does

- Logs in with username/password or email/password.
- Gets a JWT from the Tomorrow School platform.
- Loads profile data from the platform GraphQL API.
- Shows identity, XP, progress/audits, and SVG statistics.
- Supports dark and light theme.
- Logs out by clearing the saved session.

The app has no backend and no local database. It is a static frontend.

## Run

### Online

Open:

```text
https://protector01.github.io/graphql/
```

Then sign in with your Tomorrow School credentials.

### Locally

Open the project folder in VS Code and run `index.html` with Live Server.

Expected local URL:

```text
http://127.0.0.1:5500/index.html
```

If you use another static server, just serve the project root folder. No build step is needed.

## Platform API

The platform URL is not shown in the login form. The app uses this API domain internally:

```text
https://01.tomorrow-school.ai
```

Auth endpoint:

```text
https://01.tomorrow-school.ai/api/auth/signin
```

GraphQL endpoint:

```text
https://01.tomorrow-school.ai/api/graphql-engine/v1/graphql
```

## Audit Coverage

- Invalid credentials show an error.
- Valid login opens the profile page.
- Profile has three data sections:
  - `Identity`
  - `XP`
  - `Progress & audits`
- Profile has a fourth `Statistics` section.
- Statistics includes three SVG graphs:
  - XP over time
  - Top XP projects
  - Pass / fail ratio
- GraphQL queries include normal, nested, and argument-based queries.
- Logout clears the authenticated session.
- Project is deployed on GitHub Pages.

## Files

```text
index.html
src/
  api.js
  charts.js
  config.js
  main.js
  model.js
  queries.js
  storage.js
  styles.css
  utils.js
  view.js
```

## Notes

XP is calculated from the current platform event when `eventId` is available. This avoids adding old historical XP from other events.
