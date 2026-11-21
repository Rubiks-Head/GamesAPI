package providers

import (
	"strings"

	"baseapi/internal/core"
)

type Prov interface {
	Name() string
	Search(q string, pg int) ([]core.Game, error)
	Meta(id string) (*core.Game, error)
}

var All []Prov

func Reg(p Prov) { All = append(All, p) }

func Get(name string) Prov {
	for _, p := range All {
		if p.Name() == name {
			return p
		}
	}
	return nil
}

var doms map[string]string

func SetDoms(d map[string]string) { doms = d }

func base(key, dfl string) string {
	if u := doms[key]; u != "" {
		return strings.TrimSuffix(u, "/")
	}
	return dfl
}
