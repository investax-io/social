import type { IncomingMessage, ServerResponse } from "node:http";
import { handleAdminActivity } from "./runtime";

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse
) {
  await handleAdminActivity(request, response);
}
