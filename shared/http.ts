import type { IncomingMessage, ServerResponse } from "node:http";
import { cfg } from "./config.ts";
import { EgressError, readBody, safeFetch } from "./egress.ts";

export const json = (res: ServerResponse, v: unknown, code = 200) => {
  const b = JSON.stringify(v, null, 2);
  res.writeHead(code, { "content-type": "application/json", "content-length": Buffer.byteLength(b) });
  res.end(b);
};

export const err = (res: ServerResponse, m: string, code = 400) => json(res, { error: m }, code);

export const html = (res: ServerResponse, s: string, code = 200) => {
  res.writeHead(code, { "content-type": "text/html; charset=utf-8", "content-length": Buffer.byteLength(s) });
  res.end(s);
};

export const qp = (req: IncomingMessage, k: string) =>
  URL.parse(req.url ?? "/", "http://x")?.searchParams.get(k) ?? "";

export const pg = (req: IncomingMessage) => Math.min(Math.max(1, parseInt(qp(req, "pg") || "1") || 1), 10);

export function bind(addr = cfg.addr): { host?: string; port: number } {
  const m = /^(?:(.*):)?(\d+)$/.exec(addr);
  return { host: m?.[1] || undefined, port: Number(m?.[2]) || 8080 };
}

export const host = () => {
  const b = bind();
  return cfg.origin ?? `http://${b.host ?? "localhost"}:${b.port}`;
};

export const tf = (url: string, init: RequestInit = {}, ms = 15000) =>
  fetch(url, { ...init, signal: AbortSignal.timeout(ms) });

const IMG_CAP = 8 * 1024 * 1024;

export async function proxyImg(res: ServerResponse, url: string, hostOk: (u: URL) => boolean) {
  try {
    const u = await safeFetch(url, { headers: { "user-agent": ua } }, { hosts: hostOk });
    if (!u.ok) return err(res, "upstream: " + u.status, 502);
    const buf = await readBody(u, IMG_CAP);
    if (!buf) return err(res, "image too large", 502);
    res.writeHead(200, {
      "content-type": u.headers.get("content-type") ?? "image/jpeg",
      "cache-control": "public, max-age=86400",
    });
    res.end(buf);
  } catch (e) {
    if (e instanceof EgressError) return err(res, "bad img", 400);
    err(res, "upstream", 502);
  }
}

export function engErr(res: ServerResponse, e: unknown) {
  let c = "";
  let m = String(e);
  try {
    const j = JSON.parse(m) as { code?: string; message?: string };
    if (typeof j?.code === "string") {
      c = j.code;
      m = j.message ?? m;
    }
  } catch {}
  if (c === "bad_request") return err(res, m, 400);
  if (c === "not_found") return err(res, m, 404);
  console.error(e);
  err(res, "upstream", 502);
}

export const ua =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
