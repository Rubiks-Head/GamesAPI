import type { IncomingMessage } from "node:http";

export const log = (req: IncomingMessage) =>
  console.log(
    `${new Date().toISOString()} ${req.method} ${URL.parse(req.url ?? "/", "http://x")?.pathname ?? req.url ?? "/"}`,
  );
