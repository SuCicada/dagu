package ssh2

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"

	"github.com/dagu-org/dagu/internal/core"
	"github.com/dagu-org/dagu/internal/runtime"
	"github.com/dagu-org/dagu/internal/runtime/executor"
	"github.com/go-viper/mapstructure/v2"
)

var _ executor.Executor = (*mysshExec)(nil)

type mysshExec struct {
	step   core.Step
	host   string
	stdout io.Writer
	stderr io.Writer
	cmd    *exec.Cmd
}

type mysshExecConfigDefinition struct {
	Host string
}

func newSSHExec2(_ context.Context, step core.Step) (executor.Executor, error) {
	def := new(mysshExecConfigDefinition)
	md, err := mapstructure.NewDecoder(
		&mapstructure.DecoderConfig{Result: def, WeaklyTypedInput: true},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create decoder: %w", err)
	}
	if err := md.Decode(step.ExecutorConfig.Config); err != nil {
		return nil, fmt.Errorf("failed to decode ssh config: %w", err)
	}

	return &mysshExec{
		step:   step,
		host:   def.Host,
		stdout: os.Stdout,
		stderr: os.Stdout,
	}, nil
}

func (e *mysshExec) SetStdout(out io.Writer) {
	e.stdout = out
}

func (e *mysshExec) SetStderr(out io.Writer) {
	e.stderr = out
}

func (e *mysshExec) Kill(sig os.Signal) error {
	if e.cmd != nil && e.cmd.Process != nil {
		return e.cmd.Process.Signal(sig)
	}
	return nil
}

func (e *mysshExec) Run(ctx context.Context) error {
	command := buildRemoteCommand(resolveRemoteWorkingDir(ctx, e.step), e.step.Command, e.step.Args)
	e.cmd = exec.CommandContext(ctx, "ssh", e.host, command)
	e.cmd.Stdout = e.stdout
	e.cmd.Stderr = e.stderr
	return e.cmd.Run()
}

// resolveRemoteWorkingDir returns the remote working directory for ssh2.
// Precedence: step workingDir (Dir) > DAG ExplicitWorkingDir.
// Defaulted DAG WorkingDir (from file path / cwd) is never used for remote.
func resolveRemoteWorkingDir(ctx context.Context, step core.Step) string {
	if dir := strings.TrimSpace(step.Dir); dir != "" {
		return dir
	}
	if dag := runtime.GetDAGContext(ctx).DAG; dag != nil {
		return strings.TrimSpace(dag.ExplicitWorkingDir)
	}
	return ""
}

// buildRemoteCommand joins command/args and, when workdir is set,
// prefixes `cd <quoted> &&` so the remote shell runs in that directory.
func buildRemoteCommand(workdir, command string, args []string) string {
	remoteCmd := strings.Join(append([]string{command}, args...), " ")
	workdir = strings.TrimSpace(workdir)
	if workdir == "" {
		return remoteCmd
	}

	// Expand env vars only; do not resolve against the local filesystem.
	workdir = os.ExpandEnv(workdir)
	return "cd " + quoteShellArg(workdir) + " && " + remoteCmd
}

// quoteShellArg wraps s in single quotes for a POSIX remote shell.
func quoteShellArg(s string) string {
	return "'" + strings.ReplaceAll(s, "'", `'\''`) + "'"
}

func init() {
	executor.RegisterExecutor("ssh2", newSSHExec2, nil)
}
