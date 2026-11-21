import { createServer } from "node:http";
import { auth } from "./middleware/auth.ts";
import { log } from "./middleware/log.ts";
import { cfg } from "./shared/config.ts";
import { load } from "./shared/engine.ts";
import { bind, err, json } from "./shared/http.ts";
import { index } from "./routes/index.ts";
import { search } from "./routes/search.ts";
import { meta } from "./routes/lookup.ts";
import { play } from "./routes/play.ts";
import { game } from "./routes/files.ts";
import { img } from "./routes/img.ts";
import { status } from "./routes/status.ts";

const P = {
  search: new URLPattern({ pathname: "/v1/search/" }),
  searchFull: new URLPattern({ pathname: "/v1/search/~/" }),
  meta: new URLPattern({ pathname: "/v1/meta/:prov/:id" }),
  metaFull: new URLPattern({ pathname: "/v1/meta/~/:prov/:id" }),
  play: new URLPattern({ pathname: "/v1/play/:id/:file" }),
  game: new URLPattern({ pathname: "/v1/game/:id/:rest*" }),
  img: new URLPattern({ pathname: "/v1/img/:b" }),
  status: new URLPattern({ pathname: "/v1/status" }),
  health: new URLPattern({ pathname: "/healthz" }),
};

process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e));

createServer(async (req, res) => {
  try {
    log(req);
    const u = URL.parse(req.url ?? "/", `http://${req.headers.host ?? "x"}`);
    if (!u) return err(res, "bad request", 400);
    if (req.method !== "GET" && req.method !== "HEAD") return err(res, "not found", 404);
    let m: URLPatternResult | null;
    if (u.pathname === "/") return index(req, res);
    if (P.health.exec(u)) return json(res, { status: "ok" });
    if (!auth(req, res)) return;
    if ((m = P.searchFull.exec(u))) return await search(req, res, true);
    if ((m = P.search.exec(u))) return await search(req, res, false);
    if ((m = P.metaFull.exec(u))) return await meta(req, res, m.pathname.groups.prov!, m.pathname.groups.id!, true);
    if ((m = P.meta.exec(u))) return await meta(req, res, m.pathname.groups.prov!, m.pathname.groups.id!, false);
    if ((m = P.play.exec(u))) return play(req, res, m.pathname.groups.id!, m.pathname.groups.file!);
    if ((m = P.game.exec(u))) return await game(req, res, m.pathname.groups.id!, m.pathname.groups.rest ?? "");
    if ((m = P.img.exec(u))) return await img(req, res, m.pathname.groups.b!);
    if (P.status.exec(u)) return await status(req, res);
    err(res, "not found", 404);
  } catch (e) {
    console.error(e);
    err(res, "internal", 500);
  }
}).listen(bind().port, bind().host, async () => {
  await load();
  console.log(`listening on ${cfg.addr}`);
});
