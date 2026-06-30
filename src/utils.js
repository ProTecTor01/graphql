export function normalizeApiBase(value) {
  const normalized = tryNormalizeApiBase(value);
  if (!normalized) {
    throw new Error("Configured platform domain is invalid.");
  }
  return normalized;
}

export function tryNormalizeApiBase(value) {
  const trimmed = String(value || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    return url.origin;
  } catch {
    return "";
  }
}

export function encodeBasic(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function extractJwt(rawBody) {
  const body = String(rawBody || "").trim();
  if (!body) return "";

  try {
    const parsed = JSON.parse(body);
    if (typeof parsed === "string") return parsed.trim();
    if (typeof parsed?.token === "string") return parsed.token.trim();
    if (typeof parsed?.jwt === "string") return parsed.jwt.trim();
  } catch {
    return body.replace(/^"|"$/g, "").trim();
  }

  return body.replace(/^"|"$/g, "").trim();
}

export function extractServerMessage(rawBody) {
  const body = String(rawBody || "").trim();
  if (!body) return "";

  try {
    const parsed = JSON.parse(body);
    return parsed?.message || parsed?.error || "";
  } catch {
    return body.length < 160 ? body : "";
  }
}

export function parseJwtPayload(token) {
  const [, payload] = String(token || "").split(".");
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function normalizeType(value) {
  return String(value || "").trim().toLowerCase();
}

export function isPassingGrade(value) {
  return Number(value) >= 1;
}

export function getAverage(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function toNumberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function dateValue(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function toDateKey(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" }).format(date);
}

export function formatNumber(value) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Number(value) || 0);
}

export function formatCompactNumber(value) {
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(Number(value) || 0);
}

export function truncateLabel(value, maxLength) {
  const label = String(value || "");
  return label.length > maxLength ? `${label.slice(0, Math.max(0, maxLength - 1))}...` : label;
}

export function setText(element, value) {
  if (element) element.textContent = value;
}

export function getErrorMessage(error) {
  if (error instanceof TypeError && /fetch/i.test(error.message)) {
    return "Network request failed. Check platform availability and CORS access.";
  }
  return error instanceof Error ? error.message : String(error);
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
