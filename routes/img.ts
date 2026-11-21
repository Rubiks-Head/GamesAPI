import type { IncomingMessage, ServerResponse } from "node:http";
import { err, proxyImg } from "../shared/http.ts";
import { ub64 } from "../shared/enrich.ts";

const HOSTS = ["gamemonetize.com", "gamedistribution.com"];

export async function img(_req: IncomingMessage, res: ServerResponse, b: string) {
  let u: URL | null;
  try {
    u = new URL(ub64(b));
  } catch {
    u = null;
  }
  if (
    !u ||
    u.protocol !== "https:" ||
    !HOSTS.some((h) => u!.hostname === h || u!.hostname.endsWith("." + h))
  ) {
    return err(res, "bad img", 400);
  }
  await proxyImg(res, u.toString(), (x) =>
    HOSTS.some((h) => x.hostname === h || x.hostname.endsWith("." + h)),
  );
}
