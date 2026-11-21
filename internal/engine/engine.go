package engine

import (
	"strings"

	"baseapi/internal/core"
	"baseapi/internal/providers"
)

type Res struct {
	Games  []core.Game       `json:"games"`
	Errors map[string]string `json:"errors,omitempty"`
}

type Err struct {
	C string
	M string
}

func (e *Err) Error() string { return e.m() }
func (e *Err) m() string     { return e.M }

func Search(q, prov string, pg int) (*Res, error) {
	var ps []providers.Prov
	if prov == "" || prov == "all" {
		ps = providers.All
	} else {
		p := providers.Get(prov)
		if p == nil {
			return nil, &Err{C: "bad_request", M: "unknown provider: " + prov}
		}
		ps = []providers.Prov{p}
	}
	res := &Res{}
	for _, p := range ps {
		g, err := p.Search(q, pg)
		if err != nil {
			if res.Errors == nil {
				res.Errors = map[string]string{}
			}
			res.Errors[p.Name()] = err.Error()
			continue
		}
		res.Games = append(res.Games, g...)
	}
	return res, nil
}

func Meta(prov, id string) (*core.Game, error) {
	p := providers.Get(prov)
	if p == nil {
		return nil, &Err{C: "bad_request", M: "unknown provider: " + prov}
	}
	g, err := p.Meta(id)
	if g == nil && err == nil {
		return nil, &Err{C: "not_found", M: "not found: " + id}
	}
	return g, err
}

func Provs() []string {
	var out []string
	for _, p := range providers.All {
		out = append(out, p.Name())
	}
	return out
}

var _ = strings.Contains
