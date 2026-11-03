import type { IncomingMessage, ServerResponse } from "node:http";
import { handleAdminActivity } from "../../lib/adminRuntime.js";

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse
) {
  await handleAdminActivity(request, response);
}
