import type { IncomingMessage, ServerResponse } from "node:http";
import { load } from "../shared/engine.ts";
import { json } from "../shared/http.ts";

export async function status(req: IncomingMessage, res: ServerResponse) {
  const eng = await load();
  json(res, { status: "ok", provs: JSON.parse(await eng.gProvs()), uptime: process.uptime() });
}
