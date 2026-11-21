import { existsSync, readFileSync } from "node:fs";
import { parse } from "smol-toml";

export type Cfg = {
  addr: string;
  origin?: string;
  domains: Record<string, string>;
  auth: { token: string; ips: string[] };
};

const dfl: Cfg = { addr: ":9982", domains: {}, auth: { token: "", ips: [] } };

export const cfg: Cfg = (() => {
  if (!existsSync("config.toml")) {
    console.warn("config.toml missing - using defaults");
    return dfl;
  }
  const f = parse(readFileSync("config.toml", "utf8")) as Partial<Cfg>;
  return {
    ...dfl,
    ...f,
    domains: { ...dfl.domains, ...(f.domains ?? {}) },
    auth: { ...dfl.auth, ...(f.auth ?? {}) },
  };
})();
