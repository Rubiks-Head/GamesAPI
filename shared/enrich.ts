import { createHash } from "node:crypto";
import { host } from "./http.ts";

export const b64 = (s: string) => Buffer.from(s).toString("base64url");
export const ub64 = (s: string) => Buffer.from(s, "base64url").toString();

export type G = {
  id: string; source: string; name: string; description?: string;
  instructions?: string; category?: string; tags?: string[];
  thumb?: string; url: string; width?: number; height?: number;
  mobile?: boolean; engine?: string;
};

export type Reg = { prov: string; id: string; name: string; url: string };

const MAX = 5000;

const reg = new Map<string, Reg>();
const seen = new Map<string, string>();

export const exts: Record<string, string> = { gamemonetize: "gm", gamedistribution: "gd" };

export function mint(g: G): string {
  const key = `${g.source}|${g.id}`;
  let u = seen.get(key);
  if (!u || !reg.has(u)) {
    while (seen.size >= MAX) {
      const [k, v] = seen.entries().next().value!;
      seen.delete(k);
      reg.delete(v);
    }
    const h = createHash("sha256").update(key).digest("hex");
    u = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
    seen.set(key, u);
    reg.set(u, { prov: g.source, id: g.id, name: g.name, url: g.url });
  }
  return u;
}

export const lookup = (u: string) => reg.get(u);

export function vG(g: G, full = false) {
  const h = host(), u = mint(g), e = exts[g.source];
  const v: Record<string, unknown> = {
    id: u,
    name: g.name,
    category: g.category ?? null,
    tags: g.tags?.length ? g.tags : null,
    thumb: g.thumb ? `${h}/v1/img/${b64(g.thumb)}` : null,
    play_url: e ? `${h}/v1/play/${u}/${e}.html` : null,
    meta_url: `${h}/v1/meta/${g.source}/${g.id}`,
    ref: `${g.source}:${g.id}`,
  };
  if (full) {
    v.description = g.description ?? null;
    v.instructions = g.instructions ?? null;
    v.width = g.width ?? null;
    v.height = g.height ?? null;
    v.mobile = g.mobile ?? false;
    v.engine = g.engine ?? null;
  }
  return v;
}
