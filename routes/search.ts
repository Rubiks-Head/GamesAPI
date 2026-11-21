import type { IncomingMessage, ServerResponse } from "node:http";
import { load } from "../shared/engine.ts";
import { engErr, json, pg, qp } from "../shared/http.ts";
import { vG, type G } from "../shared/enrich.ts";

export async function search(req: IncomingMessage, res: ServerResponse, full: boolean) {
  const eng = await load();
  const q = qp(req, "q"), prov = qp(req, "prov") || "all";
  let r: { games: G[]; errors?: Record<string, string> };
  try {
    r = JSON.parse(await eng.gSearch(q, prov, pg(req)));
  } catch (e) {
    return engErr(res, e);
  }
  json(res, {
    games: (r.games ?? []).map((g) => vG(g, full)),
    errors: r.errors ?? undefined,
    page: pg(req),
  });
}
