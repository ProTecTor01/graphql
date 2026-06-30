import { loadDashboardData, signIn } from "./api.js";
import { DEFAULT_API_BASE } from "./config.js";
import { buildDashboardModel } from "./model.js";
import { clearSession, readSession, readStoredDomain, readTheme, writeSession, writeStoredDomain, writeTheme } from "./storage.js";
import { getErrorMessage, normalizeApiBase, parseJwtPayload, setText, tryNormalizeApiBase } from "./utils.js";
import { renderDashboardView, renderLoginView } from "./view.js";

const app = document.querySelector("#app");

const state = {
  token: "",
  apiBase: "",
  jwtPayload: null,
  dashboard: null,
  loading: false,
  error: "",
  theme: readTheme(),
};

init();

function init() {
  applyTheme();
  const session = readSession();

  if (session?.token && session?.apiBase) {
    state.token = session.token;
    state.apiBase = session.apiBase;
    state.jwtPayload = parseJwtPayload(session.token);
    loadDashboard();
    return;
  }

  renderLogin();
}

function renderLogin(formError = "") {
  app.innerHTML = renderLoginView(state.theme, formError);
  document.querySelector("#login-form")?.addEventListener("submit", handleLogin);
  document.querySelector("#theme-button")?.addEventListener("click", toggleTheme);
}

async function handleLogin(event) {
  event.preventDefault();

  const errorEl = document.querySelector("#login-error");
  const button = document.querySelector("#login-button");
  const formData = new FormData(event.currentTarget);
  const identifier = String(formData.get("identifier") || "").trim();
  const password = String(formData.get("password") || "");

  try {
    const apiBase = normalizeApiBase(getSuggestedApiBase());

    if (!identifier || !password) {
      throw new Error("Enter your username/email and password.");
    }

    setLoginBusy(button, true);
    setText(errorEl, "");

    const token = await signIn(apiBase, identifier, password);
    state.token = token;
    state.apiBase = apiBase;
    state.jwtPayload = parseJwtPayload(token);
    state.dashboard = null;
    state.error = "";

    writeSession({ token, apiBase });
    writeStoredDomain(apiBase);

    await loadDashboard();
  } catch (error) {
    setText(errorEl, getErrorMessage(error));
    setLoginBusy(button, false);
  }
}

async function loadDashboard() {
  state.loading = true;
  state.error = "";
  renderDashboard();

  try {
    const { data, objectLookupError, objects } = await loadDashboardData(state.apiBase, state.token);

    state.dashboard = buildDashboardModel(data, objects, objectLookupError, state.jwtPayload);
    state.loading = false;
    state.error = "";
    renderDashboard();
  } catch (error) {
    state.loading = false;
    state.error = getErrorMessage(error);
    renderDashboard();
  }
}

function renderDashboard() {
  app.innerHTML = renderDashboardView({
    dashboard: state.dashboard,
    error: state.error,
    jwtPayload: state.jwtPayload,
    loading: state.loading,
    theme: state.theme,
  });

  document.querySelector("#logout-button")?.addEventListener("click", logout);
  document.querySelector("#refresh-button")?.addEventListener("click", loadDashboard);
  document.querySelector("#retry-button")?.addEventListener("click", loadDashboard);
  document.querySelector("#theme-button")?.addEventListener("click", toggleTheme);
}

function logout() {
  clearSession();
  state.token = "";
  state.apiBase = "";
  state.jwtPayload = null;
  state.dashboard = null;
  state.loading = false;
  state.error = "";
  renderLogin();
}

function getSuggestedApiBase() {
  const params = new URLSearchParams(window.location.search);
  const queryDomain = params.get("domain") || params.get("api");
  const storedDomain = readStoredDomain();

  if (queryDomain) return tryNormalizeApiBase(queryDomain) || queryDomain;
  if (storedDomain) return storedDomain;

  const hostname = window.location.hostname;
  const staticHosts = ["", "localhost", "127.0.0.1", "::1"];
  const staticSuffixes = ["github.io", "netlify.app", "vercel.app", "pages.dev"];
  const isStaticHost = staticHosts.includes(hostname) || staticSuffixes.some((suffix) => hostname.endsWith(suffix));

  return hostname && !isStaticHost ? window.location.origin : DEFAULT_API_BASE;
}

function setLoginBusy(button, isBusy) {
  if (!button) return;
  button.disabled = isBusy;
  button.textContent = isBusy ? "Signing in..." : "Sign in";
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  writeTheme(state.theme);
  applyTheme();

  if (state.token) {
    renderDashboard();
  } else {
    renderLogin();
  }
}

function applyTheme() {
  document.documentElement?.setAttribute("data-theme", state.theme);
}
