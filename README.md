# GraphQL Student Profile

Static frontend project for the GraphQL profile assignment. The app authenticates a student, reads their own school data from the platform GraphQL API, and renders profile metrics plus SVG statistics.

## Data Source

This project does not include a local database and does not run its own backend.

All profile data is loaded from the school platform after a successful login. For Tomorrow School, the default platform domain is:

```text
https://01.tomorrow-school.ai
```

The app uses these platform endpoints:

```text
POST https://01.tomorrow-school.ai/api/auth/signin
POST https://01.tomorrow-school.ai/api/graphql-engine/v1/graphql
```

The login form does not show the platform URL. `https://01.tomorrow-school.ai` is used internally as the default API domain. If the project is checked against another campus domain, pass it in the URL:

```text
https://your-host.example/?domain=https://another-campus-domain
```

There is no production mock data. Mock responses were only used during local development to verify rendering without real credentials.

## Features

- Sign in with `username:password`.
- Sign in with `email:password`.
- JWT retrieval through Basic authentication.
- GraphQL requests with Bearer authentication.
- Clear error message for invalid credentials.
- Logout that clears the stored session.
- Dark and light theme switcher.
- Three required profile sections:
  - `Identity`
  - `XP`
  - `Progress & audits`
- Statistics section with SVG graphs:
  - XP over time
  - Top XP projects
  - Pass / fail ratio

## Run Locally

No build step is required.

Open `index.html` in a browser:

```text
index.html
```

If the browser blocks module scripts on `file://`, run any static server in the project folder, for example VS Code Live Server.

## Deploy To GitHub Pages

The project is static and does not need a build step.

1. Create an empty GitHub repository.
2. Push this project to that repository.
3. Open repository `Settings`.
4. Go to `Pages`.
5. Set `Source` to `Deploy from a branch`.
6. Select branch `main` and folder `/root`.
7. Save.

GitHub Pages will publish the site at:

```text
https://<github-username>.github.io/<repository-name>/
```

Files required for deployment are:

```text
index.html
.nojekyll
src/
README.md
```

## GraphQL Queries

The assignment requires normal, nested, and argument-based GraphQL queries. They are defined in `src/queries.js`.

Normal query:

```graphql
user {
  id
  login
}
```

Nested query:

```graphql
result {
  user {
    id
    login
  }
}
```

Queries with arguments:

```graphql
transaction(limit: $txLimit, order_by: { createdAt: asc })
result(limit: $resultLimit, order_by: { updatedAt: desc })
progress(limit: $progressLimit, order_by: { updatedAt: desc })
object(where: { id: { _in: $ids } })
```

## Project Structure

```text
index.html
src/
  api.js       # signin and GraphQL request helpers
  charts.js    # SVG graph rendering
  config.js    # constants and default platform domain
  main.js      # app state and event orchestration
  model.js     # data normalization and aggregation
  queries.js   # GraphQL queries
  storage.js   # localStorage session helpers
  styles.css   # responsive UI styles
  utils.js     # shared helpers
  view.js      # HTML templates
```

## Audit Checklist Coverage

- Invalid credentials display an error message.
- Valid login opens the profile page.
- The profile has three required information sections.
- The profile has a fourth statistics section.
- The statistics section contains at least two SVG graphs.
- The code uses normal, nested, and argument-based GraphQL queries.
- Dark and light themes are available from login and profile screens.
- Logout clears the authenticated session.
- The project can be hosted as a static website.

## Session Storage

The JWT is stored in `localStorage` so the profile remains open after a page refresh. Pressing `Log out` removes the stored JWT and returns the user to the login screen.

## Troubleshooting

If login works but profile data does not load, check:

- the platform domain is correct;
- `https://01.tomorrow-school.ai` is reachable;
- the platform allows requests from the selected hosted domain;
- the account has data available in the platform GraphQL API.
