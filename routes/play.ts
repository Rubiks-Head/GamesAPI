import type { IncomingMessage, ServerResponse } from "node:http";
import { err } from "../shared/http.ts";
import { exts, lookup } from "../shared/enrich.ts";
import { idx } from "./files.ts";

export function play(req: IncomingMessage, res: ServerResponse, id: string, file: string) {
  const g = lookup(id);
  if (!g || file.replace(/\.html$/, "") !== exts[g.prov]) return err(res, "not found", 404);
  return idx(req, res, g, id);
}
