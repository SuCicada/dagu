package frontend

import (
	"embed"
	"errors"
	"io/fs"
	"mime"
	"net/http"
	"path"
	"strings"
)

// docsFS holds the built VitePress documentation site. The directory is
// populated by `make docs` (see the docs/ folder at the repo root) and is
// gitignored, so a checkout without a docs build embeds only .gitkeep and the
// /docs route reports that documentation is unavailable.
//
//go:embed all:docs
var docsFS embed.FS

// docsRoutePrefix is the URL segment the documentation is served under,
// relative to the server base path. It must match the `base` set in
// docs/origin/.vitepress/config.js.
const docsRoutePrefix = "docs"

// docsSite returns the documentation site rooted at its index, and reports
// whether a build is actually embedded.
func docsSite() (fs.FS, bool) {
	sub, err := fs.Sub(docsFS, docsRoutePrefix)
	if err != nil {
		return nil, false
	}
	if _, err := fs.Stat(sub, "index.html"); err != nil {
		return nil, false
	}
	return sub, true
}

// docsHandler serves the static documentation site.
//
// VitePress is built with `cleanUrls: true`, so a request for
// /docs/reference/yaml must resolve to reference/yaml.html. net/http's
// FileServer will not do that on its own, so extension-less paths are
// resolved here before falling back to the directory index.
func docsHandler(site fs.FS, stripPrefix string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		name := strings.TrimPrefix(r.URL.Path, stripPrefix)
		name = strings.TrimPrefix(name, "/")
		if name == "" {
			name = "index.html"
		}

		resolved, err := resolveDocsPath(site, name)
		if err != nil {
			// Mirror VitePress's own 404 page when it is available.
			if page, notFoundErr := fs.ReadFile(site, "404.html"); notFoundErr == nil {
				w.Header().Set("Content-Type", "text/html; charset=utf-8")
				w.WriteHeader(http.StatusNotFound)
				_, _ = w.Write(page)
				return
			}
			http.NotFound(w, r)
			return
		}

		content, err := fs.ReadFile(site, resolved)
		if err != nil {
			http.NotFound(w, r)
			return
		}

		if ctype := mime.TypeByExtension(path.Ext(resolved)); ctype != "" {
			w.Header().Set("Content-Type", ctype)
		}
		// Hashed assets are immutable; pages are revalidated so a rebuilt
		// binary is picked up without a hard refresh.
		if strings.HasPrefix(resolved, "assets/") {
			w.Header().Set("Cache-Control", "max-age=31536000, immutable")
		} else {
			w.Header().Set("Cache-Control", "no-cache")
		}
		_, _ = w.Write(content)
	}
}

// resolveDocsPath maps a request path onto a file in the built site.
func resolveDocsPath(site fs.FS, name string) (string, error) {
	name = path.Clean(name)
	if name == "." || strings.HasPrefix(name, "..") {
		return "", errors.New("invalid path")
	}

	candidates := []string{name}
	if path.Ext(name) == "" {
		candidates = append(candidates, name+".html", path.Join(name, "index.html"))
	}

	for _, candidate := range candidates {
		info, err := fs.Stat(site, candidate)
		if err != nil || info.IsDir() {
			continue
		}
		return candidate, nil
	}

	return "", fs.ErrNotExist
}
