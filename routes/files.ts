import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import { err, host, ua } from "../shared/http.ts";
import { readBody, safeFetch, EgressError } from "../shared/egress.ts";
import { inject } from "../shared/ads.ts";
import { lookup, type Reg } from "../shared/enrich.ts";

const passthrough = ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"];
const PAGE_CAP = 8 * 1024 * 1024;

function scope(base: string) {
  const h = new URL(base).hostname;
  return (u: URL) => u.hostname === h || u.hostname.endsWith("." + h);
}

export async function idx(req: IncomingMessage, res: ServerResponse, g: Reg, id: string) {
  let u: Response;
  try {
    u = await safeFetch(g.url, { headers: { "user-agent": ua } }, { hosts: scope(g.url) });
  } catch (e) {
    if (e instanceof EgressError) return err(res, "upstream: " + e.message, 502);
    throw e;
  }
  if (!u.ok) return err(res, "upstream: " + u.status, 502);
  const body = await readBody(u, PAGE_CAP);
  if (!body) return err(res, "upstream: page too large", 502);
  const page = body.toString("utf8");
  res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
  res.end(inject(page, `${host()}/v1/game/${id}/`));
}

export async function game(req: IncomingMessage, res: ServerResponse, id: string, rest: string) {
  const g = lookup(id);
  if (!g) return err(res, "not found", 404);
  if (!rest || rest === "index.html") return idx(req, res, g, id);
  const base = g.url.endsWith("/") ? g.url : g.url.slice(0, g.url.lastIndexOf("/") + 1);
  const target = base + rest + (URL.parse(req.url ?? "/", "http://x")?.search ?? "");
  const headers: Record<string, string> = { "user-agent": ua };
  if (req.headers.range) headers.range = req.headers.range;
  let u: Response;
  try {
    u = await safeFetch(target, { headers }, { hosts: scope(base) });
  } catch (e) {
    if (e instanceof EgressError) return err(res, e.message, 400);
    throw e;
  }
  if (!u.ok || !u.body) return err(res, "upstream: " + u.status, 502);
  const out: Record<string, string> = { "cache-control": "public, max-age=86400" };
  for (const h of passthrough) {
    const v = u.headers.get(h);
    if (v) out[h] = v;
  }
  res.writeHead(u.status, out);
  Readable.fromWeb(u.body as import("node:stream/web").ReadableStream).pipe(res);
}
