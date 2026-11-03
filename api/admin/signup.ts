import type { IncomingMessage, ServerResponse } from "node:http";
import { handleAdminSignup } from "../../lib/adminRuntime";

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse
) {
  await handleAdminSignup(request, response);
}
