import { OBJECT_CHUNK_SIZE, PROGRESS_LIMIT, RESULT_LIMIT, TRANSACTION_LIMIT } from "./config.js";
import { DASHBOARD_QUERY, OBJECT_QUERY } from "./queries.js";
import { asArray, encodeBasic, extractJwt, extractServerMessage, getErrorMessage, toNumber } from "./utils.js";

export async function signIn(apiBase, identifier, password) {
  const response = await fetch(`${apiBase}/api/auth/signin`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${encodeBasic(`${identifier}:${password}`)}`,
    },
  });
  const rawBody = await response.text();

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Invalid username/email or password.");
    }

    throw new Error(extractServerMessage(rawBody) || `Sign in failed with HTTP ${response.status}.`);
  }

  const token = extractJwt(rawBody);

  if (!token) {
    throw new Error("The signin endpoint did not return a JWT.");
  }

  return token;
}

export async function loadDashboardData(apiBase, token) {
  const data = await graphqlRequest(apiBase, token, DASHBOARD_QUERY, {
    txLimit: TRANSACTION_LIMIT,
    resultLimit: RESULT_LIMIT,
    progressLimit: PROGRESS_LIMIT,
  });

  let objects = [];
  let objectLookupError = "";

  try {
    objects = await loadObjects(apiBase, token, collectObjectIds(data));
  } catch (error) {
    objectLookupError = getErrorMessage(error);
  }

  return { data, objects, objectLookupError };
}

export async function graphqlRequest(apiBase, token, query, variables = {}) {
  const response = await fetch(`${apiBase}/api/graphql-engine/v1/graphql`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Session expired or access was denied. Sign in again.");
    }
    throw new Error(`GraphQL request failed with HTTP ${response.status}.`);
  }

  if (payload?.errors?.length) {
    const message = payload.errors.map((error) => error.message).join(" ");
    throw new Error(message || "GraphQL returned an error.");
  }

  return payload?.data || {};
}

async function loadObjects(apiBase, token, ids) {
  const uniqueIds = [...new Set(ids.filter((id) => Number.isInteger(id)))];
  const objects = [];

  for (let index = 0; index < uniqueIds.length; index += OBJECT_CHUNK_SIZE) {
    const chunk = uniqueIds.slice(index, index + OBJECT_CHUNK_SIZE);
    if (chunk.length === 0) continue;
    const data = await graphqlRequest(apiBase, token, OBJECT_QUERY, { ids: chunk });
    objects.push(...asArray(data.object));
  }

  return objects;
}

function collectObjectIds(data) {
  const ids = [];

  asArray(data.transaction).forEach((item) => {
    const id = toNumber(item.objectId);
    if (Number.isInteger(id)) ids.push(id);
  });
  asArray(data.result).forEach((item) => {
    const id = toNumber(item.objectId);
    if (Number.isInteger(id)) ids.push(id);
  });
  asArray(data.progress).forEach((item) => {
    const id = toNumber(item.objectId);
    if (Number.isInteger(id)) ids.push(id);
  });

  return ids;
}
