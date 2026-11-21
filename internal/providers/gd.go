package providers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"baseapi/internal/core"
)

const gdPath = "/api/v2.0/rss/All/?collection=all&categories=All&tags=All&subType=all&type=all&mobile=all&rewarded=all&format=json&amount=100"

func dist() string { return base("game_dist", "https://catalog.api.gamedistribution.com") }

type gd struct {
	c   *http.Client
	mu  sync.Mutex
	all []core.Game
	exp time.Time
}

type gdRow struct {
	Title  string   `json:"Title"`
	Md5    string   `json:"Md5"`
	Desc   string   `json:"Description"`
	How    string   `json:"Instructions"`
	Sub    string   `json:"SubType"`
	Mobile string   `json:"Mobile"`
	W      int      `json:"Width"`
	H      int      `json:"Height"`
	URL    string   `json:"Url"`
	Assets []string `json:"Asset"`
	Cat    []string `json:"Category"`
	Tags   []string `json:"Tag"`
}

func init() { Reg(&gd{c: &http.Client{Timeout: 25 * time.Second}}) }

func (g *gd) Name() string { return "gamedistribution" }

func (g *gd) cat() ([]core.Game, error) {
	g.mu.Lock()
	defer g.mu.Unlock()
	if len(g.all) > 0 && time.Now().Before(g.exp) {
		return g.all, nil
	}
	var all []core.Game
	for pg := 1; pg <= 12; pg++ {
		r, err := g.c.Get(fmt.Sprintf("%s%s&page=%d", dist(), gdPath, pg))
		if err != nil {
			return nil, err
		}
		var rows []gdRow
		err = json.NewDecoder(r.Body).Decode(&rows)
		r.Body.Close()
		if err != nil {
			return nil, err
		}
		all = append(all, mapRows(rows, convGD)...)
		if len(rows) < 100 {
			break
		}
	}
	if len(all) > 0 {
		g.all, g.exp = all, time.Now().Add(30*time.Minute)
	}
	return g.all, nil
}

func (g *gd) Search(q string, pg int) ([]core.Game, error) {
	cat, err := g.cat()
	if err != nil {
		return nil, err
	}
	if q == "" {
		return page(cat, pg, 24), nil
	}
	terms := strings.Fields(strings.ToLower(q))
	var hit []core.Game
	for _, g2 := range cat {
		hay := strings.ToLower(g2.Name + " " + g2.Cat + " " + strings.Join(g2.Tags, " "))
		s := 0.0
		ok := true
		for _, t := range terms {
			if !strings.Contains(hay, t) {
				ok = false
				break
			}
			s++
			if strings.Contains(strings.ToLower(g2.Name), t) {
				s += 2
			}
		}
		if ok {
			g2.Score = s
			hit = append(hit, g2)
		}
	}
	sort.Slice(hit, func(i, j int) bool { return hit[i].Score > hit[j].Score })
	return page(hit, pg, 24), nil
}

func (g *gd) Meta(id string) (*core.Game, error) {
	cat, err := g.cat()
	if err != nil {
		return nil, err
	}
	for _, g2 := range cat {
		if g2.ID == id {
			return &g2, nil
		}
	}
	return nil, nil
}

func page(g []core.Game, pg, n int) []core.Game {
	if pg < 1 {
		pg = 1
	}
	lo := (pg - 1) * n
	if lo >= len(g) {
		return nil
	}
	hi := lo + n
	if hi > len(g) {
		hi = len(g)
	}
	return g[lo:hi]
}

func convGD(r gdRow) core.Game {
	g := core.Game{
		ID: r.Md5, Source: "gamedistribution", Name: r.Title, Desc: r.Desc,
		How: r.How, Tags: r.Tags, W: r.W, H: r.H,
		Mobile: r.Mobile == "true", Engine: r.Sub,
		URL: "https://html5.gamedistribution.com/rvvASMiM/" + r.Md5 + "/index.html",
	}
	if len(r.Cat) > 0 {
		g.Cat = strings.Join(r.Cat, ", ")
	}
	if len(r.Assets) > 0 {
		g.Thumb = r.Assets[0]
	}
	return g
}
