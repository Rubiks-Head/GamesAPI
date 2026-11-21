import type { IncomingMessage, ServerResponse } from "node:http";
import { cfg } from "../shared/config.ts";
import { err } from "../shared/http.ts";

function ipOk(req: IncomingMessage): boolean {
  const { ips } = cfg.auth;
  if (!ips.length) return true;
  const a = req.socket.remoteAddress ?? "";
  const v = a.startsWith("::ffff:") ? a.slice(7) : a;
  return ips.includes(v === "::1" ? "127.0.0.1" : v);
}

export function auth(req: IncomingMessage, res: ServerResponse): boolean {
  const { token, ips } = cfg.auth;
  if (!token && !ips.length) return true;
  if (!ipOk(req)) {
    err(res, "forbidden", 403);
    return false;
  }
  if (token) {
    const q = URL.parse(req.url ?? "/", "http://x")?.searchParams ?? new URLSearchParams();
    const t = q.get("tkn") ?? q.get("key") ?? req.headers["x-api-key"];
    if (t !== token) {
      err(res, "unauthorized", 401);
      return false;
    }
  }
  return true;
}
