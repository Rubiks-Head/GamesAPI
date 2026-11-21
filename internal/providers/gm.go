package providers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"baseapi/internal/core"
)

type gm struct{ c *http.Client }

type gmRow struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Desc  string `json:"description"`
	How   string `json:"instructions"`
	URL   string `json:"url"`
	Cat   string `json:"category"`
	Tags  string `json:"tags"`
	Thumb string `json:"thumb"`
	W     string `json:"width"`
	H     string `json:"height"`
}

func init() { Reg(&gm{&http.Client{Timeout: 20 * time.Second}}) }

func (g *gm) Name() string { return "gamemonetize" }

func (g *gm) get(q url.Values) ([]gmRow, error) {
	q.Set("format", "0")
	r, err := g.c.Get(base("game_mon", "https://gamemonetize.com") + "/feed.php?" + q.Encode())
	if err != nil {
		return nil, err
	}
	defer r.Body.Close()
	var rows []gmRow
	return rows, json.NewDecoder(r.Body).Decode(&rows)
}

func (g *gm) Search(q string, pg int) ([]core.Game, error) {
	v := url.Values{"num": {"24"}, "page": {fmt.Sprint(pg)}}
	if q != "" {
		v.Set("name", q)
	}
	rows, err := g.get(v)
	return mapRows(rows, convGM), err
}

func (g *gm) Meta(id string) (*core.Game, error) {
	rows, err := g.get(url.Values{"id": {id}, "num": {"1"}})
	if err != nil || len(rows) == 0 {
		return nil, err
	}
	gm := convGM(rows[0])
	return &gm, nil
}

func convGM(r gmRow) core.Game {
	g := core.Game{
		ID: r.ID, Source: "gamemonetize", Name: r.Title, Desc: r.Desc,
		How: r.How, Cat: r.Cat, Thumb: r.Thumb, URL: r.URL, W: atoi(r.W), H: atoi(r.H),
	}
	if r.Tags != "" {
		for _, t := range strings.Split(r.Tags, ",") {
			if t = strings.TrimSpace(t); t != "" {
				g.Tags = append(g.Tags, t)
			}
		}
	}
	return g
}

func atoi(s string) int {
	n := 0
	for _, c := range s {
		if c < '0' || c > '9' {
			break
		}
		n = n*10 + int(c-'0')
	}
	return n
}

func mapRows[T any](rows []T, conv func(T) core.Game) []core.Game {
	out := make([]core.Game, 0, len(rows))
	for _, r := range rows {
		out = append(out, conv(r))
	}
	return out
}
