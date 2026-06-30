import { renderPassFailDonut, renderXpBarChart, renderXpLineChart } from "./charts.js";
import { getObjectLabel } from "./model.js";
import { escapeHtml, formatDate, formatNumber } from "./utils.js";

export function renderLoginView(theme, formError = "") {
  const nextTheme = theme === "dark" ? "Light" : "Dark";

  return `
    <main class="login-layout">
      <section class="login-panel" aria-labelledby="login-title">
        <div class="login-toolbar">
          <div class="brand-row">
            <div class="brand-mark" aria-hidden="true">GQL</div>
            <div>
              <p class="eyebrow">Student profile</p>
              <h1 id="login-title">GraphQL Profile</h1>
            </div>
          </div>
          <button id="theme-button" class="icon-button" type="button" aria-label="Switch to ${nextTheme} theme">${nextTheme}</button>
        </div>

        <form id="login-form" class="login-form">
          <label class="field">
            <span>Username or email</span>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autocomplete="username"
              required
            />
          </label>

          <label class="field">
            <span>Password</span>
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
            />
          </label>

          <p id="login-error" class="error-message" role="alert">${escapeHtml(formError)}</p>
          <button id="login-button" class="primary-button" type="submit">Sign in</button>
        </form>
      </section>
    </main>
  `;
}

export function renderDashboardView({ dashboard, error, jwtPayload, loading, theme }) {
  const title = dashboard?.user?.login || jwtPayload?.sub || "Profile";
  const nextTheme = theme === "dark" ? "Light" : "Dark";

  return `
    <main class="app-shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">GraphQL profile</p>
          <h1>${escapeHtml(String(title))}</h1>
        </div>
        <div class="topbar-actions">
          <button id="theme-button" class="secondary-button" type="button" aria-label="Switch to ${nextTheme} theme">${nextTheme}</button>
          <button id="refresh-button" class="secondary-button" type="button">Refresh</button>
          <button id="logout-button" class="secondary-button danger" type="button">Log out</button>
        </div>
      </header>

      ${loading && !dashboard ? renderLoadingState() : ""}
      ${error ? renderErrorState(error) : ""}
      ${dashboard ? renderProfile(dashboard) : ""}
    </main>
  `;
}

function renderLoadingState() {
  return `
    <section class="status-panel" aria-live="polite">
      <div class="loader" aria-hidden="true"></div>
      <p>Loading profile data...</p>
    </section>
  `;
}

function renderErrorState(message) {
  return `
    <section class="status-panel error-panel" role="alert">
      <p>${escapeHtml(message)}</p>
      <button id="retry-button" class="secondary-button" type="button">Try again</button>
    </section>
  `;
}

function renderProfile(model) {
  return `
    <div class="dashboard">
      ${model.objectLookupError ? renderNotice(`Object lookup failed: ${model.objectLookupError}`) : ""}
      <section class="dashboard-section" aria-labelledby="identity-title">
        <div class="section-heading">
          <h2 id="identity-title">Identity</h2>
        </div>
        <div class="metric-grid">
          ${renderMetric("Login", model.user?.login || "Unknown")}
          ${renderMetric("User ID", model.user?.id ?? "Unknown")}
          ${renderMetric("JWT subject", model.jwtPayload?.sub || model.jwtPayload?.["https://hasura.io/jwt/claims"]?.["x-hasura-user-id"] || "Available after signin")}
          ${renderMetric("Data owner", model.recentGrades[0]?.nestedLogin || model.user?.login || "Authenticated user")}
        </div>
      </section>

      <section class="dashboard-section" aria-labelledby="xp-title">
        <div class="section-heading">
          <h2 id="xp-title">XP</h2>
          <p>${escapeHtml(model.xpScopeLabel)} &middot; ${formatNumber(model.xpTransactions.length)} XP transactions</p>
        </div>
        <div class="metric-grid">
          ${renderMetric("Total XP", `${formatNumber(model.totalXp)} XP`)}
          ${renderMetric("Projects with XP", formatNumber(model.xpByProject.length))}
          ${renderMetric("Largest XP source", model.biggestXp ? model.biggestXp.label : "No XP yet")}
          ${renderMetric("Largest XP amount", model.biggestXp ? `${formatNumber(model.biggestXp.amount)} XP` : "0 XP")}
        </div>
        ${renderTable(
          "Recent XP",
          ["Project", "XP", "Date"],
          model.recentXp.map((item) => [
            getObjectLabel(item.objectId, item.path, model.objectMap),
            `${formatNumber(item.amount)} XP`,
            formatDate(item.createdAt),
          ]),
        )}
      </section>

      <section class="dashboard-section" aria-labelledby="progress-title">
        <div class="section-heading">
          <h2 id="progress-title">Progress & audits</h2>
          <p>${formatNumber(model.results.length || model.progress.length)} grade records loaded</p>
        </div>
        <div class="metric-grid">
          ${renderMetric("Passed", formatNumber(model.passedCount))}
          ${renderMetric("Failed", formatNumber(model.failedCount))}
          ${renderMetric("Average grade", model.averageGrade === null ? "No grades" : model.averageGrade.toFixed(2))}
          ${renderMetric("Audit ratio", model.auditRatio === null ? "No audit data" : model.auditRatio.toFixed(2))}
        </div>
        <div class="audit-strip">
          <div>
            <span>Done</span>
            <strong>${formatNumber(model.auditUp)}</strong>
          </div>
          <div>
            <span>Received</span>
            <strong>${formatNumber(model.auditDown)}</strong>
          </div>
        </div>
        ${renderTable(
          "Recent results",
          ["Path", "Grade", "Updated"],
          model.recentGrades.map((item) => [
            getObjectLabel(item.objectId, item.path, model.objectMap),
            item.grade === null ? "N/A" : item.grade.toFixed(2),
            formatDate(item.updatedAt || item.createdAt),
          ]),
        )}
      </section>

      <section class="dashboard-section" aria-labelledby="stats-title">
        <div class="section-heading">
          <h2 id="stats-title">Statistics</h2>
          <p>SVG graphs</p>
        </div>
        <div class="graph-grid">
          ${renderGraphCard("XP over time", renderXpLineChart(model.xpTimeline))}
          ${renderGraphCard("Top XP projects", renderXpBarChart(model.xpByProject.slice(0, 8)))}
          ${renderGraphCard("Pass / fail ratio", renderPassFailDonut(model.passedCount, model.failedCount))}
        </div>
      </section>
    </div>
  `;
}

function renderMetric(label, value) {
  return `
    <article class="metric-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
    </article>
  `;
}

function renderTable(title, columns, rows) {
  if (!rows.length) {
    return `
      <div class="table-block">
        <h3>${escapeHtml(title)}</h3>
        <p class="empty-state">No records found.</p>
      </div>
    `;
  }

  return `
    <div class="table-block">
      <h3>${escapeHtml(title)}</h3>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
                  <tr>
                    ${row.map((cell) => `<td title="${escapeHtml(String(cell))}">${escapeHtml(String(cell))}</td>`).join("")}
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderGraphCard(title, svg) {
  return `
    <article class="graph-card">
      <h3>${escapeHtml(title)}</h3>
      ${svg}
    </article>
  `;
}

function renderNotice(message) {
  return `<div class="notice" role="status">${escapeHtml(message)}</div>`;
}
