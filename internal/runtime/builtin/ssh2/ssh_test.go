package ssh2

import (
	"context"
	"testing"

	"github.com/dagu-org/dagu/internal/core"
	"github.com/dagu-org/dagu/internal/core/execution"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBuildRemoteCommand(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		workdir  string
		command  string
		args     []string
		expected string
	}{
		{
			name:     "NoWorkingDir",
			command:  "uname",
			args:     []string{"-a"},
			expected: "uname -a",
		},
		{
			name:     "WithWorkingDir",
			workdir:  "/opt/app",
			command:  "make",
			args:     []string{"build"},
			expected: "cd '/opt/app' && make build",
		},
		{
			name:     "WorkingDirWithSpaces",
			workdir:  "/opt/my app",
			command:  "ls",
			expected: "cd '/opt/my app' && ls",
		},
		{
			name:     "WorkingDirWithSingleQuote",
			workdir:  "/opt/o'reilly",
			command:  "pwd",
			expected: "cd '/opt/o'\\''reilly' && pwd",
		},
		{
			name:     "WhitespaceOnlyWorkingDirIgnored",
			workdir:  "   ",
			command:  "pwd",
			expected: "pwd",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			got := buildRemoteCommand(tt.workdir, tt.command, tt.args)
			assert.Equal(t, tt.expected, got)
		})
	}
}

func TestBuildRemoteCommand_ExpandEnv(t *testing.T) {
	t.Setenv("SSH2_TEST_WORKDIR", "/remote/from/env")
	got := buildRemoteCommand("${SSH2_TEST_WORKDIR}/bin", "echo", []string{"ok"})
	assert.Equal(t, "cd '/remote/from/env/bin' && echo ok", got)
}

func TestResolveRemoteWorkingDir(t *testing.T) {
	t.Parallel()

	t.Run("StepDirTakesPrecedence", func(t *testing.T) {
		t.Parallel()
		dag := &core.DAG{ExplicitWorkingDir: "/dag/explicit"}
		ctx := execution.NewContext(context.Background(), dag, "run-1", "")
		step := core.Step{Dir: "/step/dir", Command: "pwd"}
		assert.Equal(t, "/step/dir", resolveRemoteWorkingDir(ctx, step))
	})

	t.Run("FallsBackToDAGExplicitWorkingDir", func(t *testing.T) {
		t.Parallel()
		dag := &core.DAG{
			WorkingDir:         "/local/defaulted/or/resolved",
			ExplicitWorkingDir: "/remote/from/dag",
		}
		ctx := execution.NewContext(context.Background(), dag, "run-1", "")
		step := core.Step{Command: "pwd"}
		assert.Equal(t, "/remote/from/dag", resolveRemoteWorkingDir(ctx, step))
	})

	t.Run("IgnoresDefaultedDAGWorkingDir", func(t *testing.T) {
		t.Parallel()
		dag := &core.DAG{
			WorkingDir: "/Users/local/dags", // defaulted from file dir; ExplicitWorkingDir empty
		}
		ctx := execution.NewContext(context.Background(), dag, "run-1", "")
		step := core.Step{Command: "pwd"}
		assert.Equal(t, "", resolveRemoteWorkingDir(ctx, step))
	})

	t.Run("NoDAGContext", func(t *testing.T) {
		t.Parallel()
		step := core.Step{Command: "pwd"}
		assert.Equal(t, "", resolveRemoteWorkingDir(context.Background(), step))
	})
}

func TestNewSSHExec2_DecodesHost(t *testing.T) {
	t.Parallel()

	step := core.Step{
		Name:    "ssh-exec",
		Command: "uname -a",
		Dir:     "/opt/app",
		ExecutorConfig: core.ExecutorConfig{
			Type: "ssh2",
			Config: map[string]any{
				"Host": "mint",
			},
		},
	}
	exec, err := newSSHExec2(context.Background(), step)
	require.NoError(t, err)

	sshExec, ok := exec.(*mysshExec)
	require.True(t, ok)
	assert.Equal(t, "mint", sshExec.host)
	assert.Equal(t, "/opt/app", sshExec.step.Dir)
	assert.Equal(t, "cd '/opt/app' && uname -a", buildRemoteCommand(sshExec.step.Dir, sshExec.step.Command, sshExec.step.Args))
}
