package ssh2

import (
	"context"
	"fmt"
	"testing"

	"github.com/dagu-org/dagu/internal/core"
	"github.com/stretchr/testify/require"
)

func TestSSHExecutor2(t *testing.T) {
	t.Parallel()

	t.Run("Basic", func(t *testing.T) {
		step := core.Step{
			Name:    "ssh-exec",
			Command: "uname -a ",
			ExecutorConfig: core.ExecutorConfig{
				Type: "ssh2",
				Config: map[string]any{
					"Host": "mint",
				},
			},
		}
		ctx := context.Background()
		exec, err := newSSHExec2(ctx, step)
		require.NoError(t, err)

		sshExec, ok := exec.(*mysshExec)
		require.True(t, ok)
		fmt.Println(sshExec)
		err = sshExec.Run(ctx)
		require.NoError(t, err)
	})
}
