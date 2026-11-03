import type { IncomingMessage, ServerResponse } from "node:http";
import { handleAdminAuth } from "../../lib/adminRuntime.js";

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse
) {
  await handleAdminAuth(request, response);
}
