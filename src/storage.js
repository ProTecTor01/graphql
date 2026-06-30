import { DOMAIN_KEY, SESSION_KEY, THEME_KEY } from "./config.js";

export function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function writeSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function readStoredDomain() {
  return localStorage.getItem(DOMAIN_KEY);
}

export function writeStoredDomain(apiBase) {
  localStorage.setItem(DOMAIN_KEY, apiBase);
}

export function readTheme() {
  const theme = localStorage.getItem(THEME_KEY);
  return theme === "light" || theme === "dark" ? theme : "dark";
}

export function writeTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}
