import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { cfg } from "./config.ts";

export type Eng = {
  gSearch(q: string, prov: string, pg: number): Promise<string>;
  gMeta(prov: string, id: string): Promise<string>;
  gProvs(): Promise<string>;
};

declare global {
  var gInit: (cfg: string) => Promise<string>;
  var gSearch: Eng["gSearch"];
  var gMeta: Eng["gMeta"];
  var gProvs: Eng["gProvs"];
}

let eng: Eng | null = null;
let pending: Promise<Eng> | null = null;

export function load(): Promise<Eng> {
  if (eng) return Promise.resolve(eng);
  pending ??= boot().then(
    (e) => (eng = e),
    (e) => {
      pending = null;
      throw e;
    },
  );
  return pending;
}

async function boot(): Promise<Eng> {
  const wasm = readdirSync(".Out").find((f) => f.startsWith("build-") && f.endsWith(".wasm"));
  if (!wasm) throw new Error("no wasm build - run node build.mjs");
  const req = createRequire(import.meta.url);
  const mod = { exports: {} as any };
  new Function("module", "exports", "require",
    readFileSync(".Out/wasm_exec.js", "utf8") + "\nmodule.exports = Go;",
  )(mod, mod.exports, req);
  const go = new mod.exports();
  const { instance } = await WebAssembly.instantiate(
    readFileSync(join(".Out", wasm)) as unknown as BufferSource,
    go.importObject,
  );
  go.run(instance);
  await globalThis.gInit(JSON.stringify({ domains: cfg.domains }));
  return { gSearch: globalThis.gSearch, gMeta: globalThis.gMeta, gProvs: globalThis.gProvs };
}
