import type { IncomingMessage, ServerResponse } from "node:http";
import { json } from "../shared/http.ts";

export const index = (_req: IncomingMessage, res: ServerResponse) =>
  json(res, {
    name: "gameapi",
    routes: [
      "GET /v1/search/?q=&prov=gm|gd|all&pg=",
      "GET /v1/search/~/?q= (full meta)",
      "GET /v1/meta/:prov/:id",
      "GET /v1/meta/~/:prov/:id",
      "GET /v1/play/:id/:prov.html (full-frame player)",
      "GET /v1/game/:id/index.html (proxied ad-free game)",
      "GET /v1/img/:b64 (image proxy)",
      "GET /v1/status",
      "GET /healthz",
    ],
  });
