package filedag

import (
	"github.com/dagu-org/dagu/internal/core"
	"github.com/dagu-org/dagu/internal/core/execution"
)

// FileIDProvider exposes stable DAG file identifiers (e.g. test~job for nested paths).
type FileIDProvider interface {
	FileID(*core.DAG) string
}

// DAGFileID returns the identifier used for suspend flags and API v2 fileName fields.
func DAGFileID(store execution.DAGStore, dag *core.DAG) string {
	if dag == nil {
		return ""
	}
	if provider, ok := store.(FileIDProvider); ok {
		if id := provider.FileID(dag); id != "" {
			return id
		}
	}
	return dag.FileName()
}
