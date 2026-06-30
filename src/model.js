import {
  asArray,
  dateValue,
  getAverage,
  isPassingGrade,
  normalizeType,
  toDateKey,
  toNumber,
  toNumberOrNull,
} from "./utils.js";

export function buildDashboardModel(data, objects, objectLookupError, jwtPayload) {
  const objectMap = new Map(asArray(objects).map((item) => [toNumber(item.id), item]));
  const user = asArray(data.user)[0] || null;
  const transactions = asArray(data.transaction).map(normalizeTransaction);
  const results = asArray(data.result).map(normalizeGradeRow);
  const progress = asArray(data.progress).map(normalizeGradeRow);
  const allXpTransactions = transactions.filter((item) => normalizeType(item.type) === "xp" && item.amount > 0);
  const xpScope = getXpScope(allXpTransactions);
  const xpTransactions = xpScope.transactions;
  const auditUp = transactions
    .filter((item) => normalizeType(item.type) === "up")
    .reduce((sum, item) => sum + Math.max(item.amount, 0), 0);
  const auditDown = transactions
    .filter((item) => normalizeType(item.type) === "down")
    .reduce((sum, item) => sum + Math.max(item.amount, 0), 0);
  const latestResults = getLatestRows(results.length ? results : progress);
  const passedRows = latestResults.filter((item) => isPassingGrade(item.grade));
  const failedRows = latestResults.filter((item) => item.grade !== null && !isPassingGrade(item.grade));
  const xpByProject = getXpByProject(xpTransactions, objectMap);
  const xpTimeline = getXpTimeline(xpTransactions);
  const recentXp = [...xpTransactions]
    .sort((left, right) => dateValue(right.createdAt) - dateValue(left.createdAt))
    .slice(0, 8);
  const recentGrades = [...latestResults]
    .sort((left, right) => dateValue(right.updatedAt || right.createdAt) - dateValue(left.updatedAt || left.createdAt))
    .slice(0, 8);
  const biggestXp = xpByProject[0] || null;

  return {
    user,
    jwtPayload,
    transactions,
    results,
    progress,
    objectMap,
    objectLookupError,
    allXpTransactions,
    xpTransactions,
    xpScopeLabel: xpScope.label,
    xpScopeEventId: xpScope.eventId,
    xpTimeline,
    xpByProject,
    recentXp,
    recentGrades,
    totalXp: xpTransactions.reduce((sum, item) => sum + item.amount, 0),
    auditUp,
    auditDown,
    auditRatio: auditDown > 0 ? auditUp / auditDown : null,
    passedCount: passedRows.length,
    failedCount: failedRows.length,
    averageGrade: getAverage(latestResults.map((item) => item.grade).filter((grade) => grade !== null)),
    biggestXp,
  };
}

export function getObjectLabel(objectId, path, objectMap) {
  const object = Number.isInteger(objectId) ? objectMap.get(objectId) : null;
  const pathName = path ? path.split("/").filter(Boolean).at(-1) : "";
  const objectName = object?.name ? String(object.name) : "";
  const objectType = object?.type ? String(object.type) : "";

  if (objectName && pathName && objectName !== pathName) {
    return `${pathName} (${objectName})`;
  }
  if (objectName && objectType) return `${objectName} (${objectType})`;
  if (objectName) return objectName;
  if (pathName) return pathName;
  if (Number.isInteger(objectId)) return `Object ${objectId}`;
  return "Unknown";
}

function getXpTimeline(xpTransactions) {
  const daily = new Map();

  xpTransactions.forEach((item) => {
    const date = toDateKey(item.createdAt);
    if (!date) return;
    daily.set(date, (daily.get(date) || 0) + item.amount);
  });

  let runningTotal = 0;
  return [...daily.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, amount]) => {
      runningTotal += amount;
      return { date, amount, total: runningTotal };
    });
}

function getXpByProject(xpTransactions, objectMap) {
  const groups = new Map();

  xpTransactions.forEach((item) => {
    const key = item.objectId ?? item.path ?? item.id;
    const current = groups.get(key) || {
      objectId: item.objectId,
      path: item.path,
      amount: 0,
      count: 0,
      label: getObjectLabel(item.objectId, item.path, objectMap),
    };

    current.amount += item.amount;
    current.count += 1;
    groups.set(key, current);
  });

  return [...groups.values()].sort((left, right) => right.amount - left.amount);
}

function getLatestRows(rows) {
  const sorted = [...rows].sort((left, right) => dateValue(right.updatedAt || right.createdAt) - dateValue(left.updatedAt || left.createdAt));
  const latest = new Map();

  sorted.forEach((item) => {
    const key = item.objectId ?? item.path ?? item.id;
    if (!latest.has(key)) latest.set(key, item);
  });

  return [...latest.values()];
}

function normalizeTransaction(item) {
  return {
    id: toNumber(item.id),
    type: item.type || "",
    amount: toNumber(item.amount) || 0,
    objectId: toNumberOrNull(item.objectId),
    userId: toNumberOrNull(item.userId),
    eventId: toNumberOrNull(item.eventId),
    createdAt: item.createdAt || "",
    path: item.path || "",
  };
}

function getXpScope(xpTransactions) {
  const transactionsWithEvent = xpTransactions.filter((item) => Number.isInteger(item.eventId));
  const eventIds = new Set(transactionsWithEvent.map((item) => item.eventId));

  if (eventIds.size <= 1) {
    return {
      eventId: eventIds.values().next().value ?? null,
      label: "All XP",
      transactions: xpTransactions,
    };
  }

  const totalsByEvent = new Map();

  transactionsWithEvent.forEach((item) => {
    totalsByEvent.set(item.eventId, (totalsByEvent.get(item.eventId) || 0) + item.amount);
  });

  const [eventId] = [...totalsByEvent.entries()].sort((left, right) => right[1] - left[1])[0];

  return {
    eventId,
    label: "Current event XP",
    transactions: xpTransactions.filter((item) => item.eventId === eventId),
  };
}

function normalizeGradeRow(item) {
  return {
    id: toNumber(item.id),
    objectId: toNumberOrNull(item.objectId),
    userId: toNumberOrNull(item.userId),
    grade: toNumberOrNull(item.grade),
    type: item.type || "",
    createdAt: item.createdAt || "",
    updatedAt: item.updatedAt || item.createdAt || "",
    path: item.path || "",
    nestedLogin: item.user?.login || "",
  };
}
