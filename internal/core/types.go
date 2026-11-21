package core

type Game struct {
	ID     string   `json:"id"`
	Source string   `json:"source"`
	Name   string   `json:"name"`
	Desc   string   `json:"description,omitempty"`
	How    string   `json:"instructions,omitempty"`
	Cat    string   `json:"category,omitempty"`
	Tags   []string `json:"tags,omitempty"`
	Thumb  string   `json:"thumb,omitempty"`
	URL    string   `json:"url"`
	W      int      `json:"width,omitempty"`
	H      int      `json:"height,omitempty"`
	Mobile bool     `json:"mobile,omitempty"`
	Engine string   `json:"engine,omitempty"`
	Score  float64  `json:"-"`
}
