package ssh2

import (
	"context"
	"fmt"

	"github.com/dagu-org/dagu/internal/common/logger"
	"github.com/dagu-org/dagu/internal/core"
	"github.com/dagu-org/dagu/internal/runtime/executor"

	"io"
	"os"
	"strings"

	"github.com/go-viper/mapstructure/v2"
	"github.com/k1LoW/sshc/v4"
	"golang.org/x/crypto/ssh"
)

var _ executor.Executor = (*mysshExec)(nil)

type mysshExec struct {
	step core.Step
	// config    *sshExecConfig
	// sshConfig *ssh.ClientConfig
	host    string
	stdout  io.Writer
	stderr  io.Writer
	session *ssh.Session
}

type mysshExecConfigDefinition struct {
	Host string
	// User                  string
	// IP                    string
	// Port                  string
	// Key                   string
	// Password              string
	// StrictHostKeyChecking bool
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
		step: step,
		host: def.Host,
		// config:    &cfg,
		// sshConfig: sshConfig,
		stdout: os.Stdout,
		stderr: os.Stderr,
	}, nil
}

func (e *mysshExec) SetStdout(out io.Writer) {
	e.stdout = out
}

func (e *mysshExec) SetStderr(out io.Writer) {
	e.stderr = out
}

func (e *mysshExec) Kill(_ os.Signal) error {
	if e.session != nil {
		return e.session.Close()
	}
	return nil
}

func (e *mysshExec) Run(ctx context.Context) error {
	conn, err := sshc.NewClient(e.host)
	if err != nil {
		u, _ := os.UserHomeDir()
		logger.Error(ctx, fmt.Sprintf("Run ssh2 failed %v %v", err, u))
		return err
	}

	session, err := conn.NewSession()
	if err != nil {
		return err
	}
	e.session = session
	defer func() {
		_ = session.Close()
	}()

	// Once a Session is created, you can execute a single command on
	// the remote side using the Run method.
	session.Stdout = e.stdout
	session.Stderr = e.stderr
	command := strings.Join(
		append([]string{e.step.Command}, e.step.Args...), " ",
	)
	return session.Run(command)
}

func init() {
	executor.RegisterExecutor("ssh2", newSSHExec2, nil)
}
