import type { IncomingMessage, ServerResponse } from "node:http";
import { load } from "../shared/engine.ts";
import { engErr, err, json } from "../shared/http.ts";
import { vG, type G } from "../shared/enrich.ts";

export async function meta(_req: IncomingMessage, res: ServerResponse, prov: string, id: string, full: boolean) {
  const eng = await load();
  let g: G | null;
  try {
    g = JSON.parse(await eng.gMeta(prov, id));
  } catch (e) {
    return engErr(res, e);
  }
  if (!g) return err(res, "not found", 404);
  json(res, vG(g, full));
}
