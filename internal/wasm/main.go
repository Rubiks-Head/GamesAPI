//go:build js && wasm

package main

import (
	"encoding/json"
	"syscall/js"

	"baseapi/internal/engine"
	"baseapi/internal/providers"
)

func wrap(fn func(args []js.Value) (any, error)) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) any {
		cb := js.FuncOf(func(_ js.Value, pa []js.Value) any {
			res, rej := pa[0], pa[1]
			go func() {
				v, err := fn(args)
				if err != nil {
					if ee, ok := err.(*engine.Err); ok {
						b, _ := json.Marshal(map[string]string{"code": ee.C, "message": ee.M})
						rej.Invoke(string(b))
						return
					}
					rej.Invoke(err.Error())
					return
				}
				res.Invoke(v)
			}()
			return nil
		})
		defer cb.Release()
		return js.Global().Get("Promise").New(cb)
	})
}

func jstr(v any) (string, error) {
	b, err := json.Marshal(v)
	return string(b), err
}

func main() {
	g := js.Global()
	g.Set("gInit", wrap(func(a []js.Value) (any, error) {
		var cfg struct {
			Domains map[string]string `json:"domains"`
		}
		if err := json.Unmarshal([]byte(a[0].String()), &cfg); err != nil {
			return nil, err
		}
		providers.SetDoms(cfg.Domains)
		return "ok", nil
	}))
	g.Set("gSearch", wrap(func(a []js.Value) (any, error) {
		pg := 1
		if len(a) > 2 {
			pg = a[2].Int()
		}
		r, err := engine.Search(a[0].String(), a[1].String(), pg)
		if err != nil {
			return nil, err
		}
		return jstr(r)
	}))
	g.Set("gMeta", wrap(func(a []js.Value) (any, error) {
		g2, err := engine.Meta(a[0].String(), a[1].String())
		if err != nil {
			return nil, err
		}
		return jstr(g2)
	}))
	g.Set("gProvs", wrap(func(a []js.Value) (any, error) {
		return jstr(engine.Provs())
	}))
	<-make(chan struct{})
}
