# SSH Executor

Run a step on a remote host by shelling out to the system `ssh` client.

```yaml
steps:
  - name: remote task
    executor:
      type: ssh2
      config:
        host: server        # ~/.ssh/config alias, or user@host
    command: /path/to/script.sh
```

`host` is handed straight to `ssh`, so everything in your `~/.ssh/config` applies:
user, port, identity file, jump hosts, agent forwarding. There is no separate
key/port/user configuration to duplicate here.

## Working Directory

Set a remote working directory per step with `dir`, or for the whole DAG with
`workingDir`. Step-level `dir` wins. It becomes a `cd <dir> && ...` prefix on the
remote command:

```yaml
workingDir: /home/peng/app

steps:
  - name: build
    executor:
      type: ssh2
      config:
        host: server
    command: make build

  - name: elsewhere
    executor:
      type: ssh2
      config:
        host: server
    dir: /srv/other          # overrides workingDir
    command: ./run.sh
```

A DAG-level `workingDir` that was only *defaulted* (derived from the DAG file's own
location) is never sent to the remote host — only an explicitly set one is.

## Stopping a remote step

Aborting a run kills the **local** `ssh` process. The command on the remote host keeps
running: with no PTY, closing the connection delivers no signal to the remote side.

To make the remote process die with the connection, request a PTY yourself:

```yaml
    command: ssh -tt server 'long-running-thing'
```

Otherwise have the remote command clean up after itself (`trap`, `timeout`, a lock
file). This matters most for steps that hold a lock — an aborted `restic` or `rclone`
backup can leave its repository locked.

## Deprecated: the old `ssh` executor

`executor.type: ssh` and the DAG-level `ssh:` config block are both deprecated. They
still work but log a warning:

```
executor type 'ssh' is deprecated, use 'ssh2' instead
DAG field 'ssh' is deprecated; configure steps with executor type 'ssh2' instead
```

Note that `ssh2` does **not** read the DAG-level `ssh:` block — configure each step's
`config.host` instead, and keep credentials in `~/.ssh/config`.
