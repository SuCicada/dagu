  




[Examples](https://docs.dagu.cloud/writing-workflows/examples) | [API Reference](https://docs.dagu.cloud/overview/api) | [Configuration](https://docs.dagu.cloud/configurations/server) | [Discord](https://discord.gg/gpahPUjGRk)

## What is Dagu?

**Dagu is a self-contained, lightweight workflow engine for enterprise and small teams.** Define workflows in simple YAML, execute them anywhere with a single binary, compose complex pipelines from reusable sub-workflows, and distribute tasks across workers. All without requiring databases, message brokers, or code changes to your existing scripts.

Built for developers who want powerful workflow orchestration without the operational overhead. For a quick feel of how it works, take a look at the [examples](https://docs.dagu.cloud/writing-workflows/examples).

### Web UI Preview

Demo Web UI

### CLI Preview

Demo CLI

## Why Dagu?



### 🚀 Zero Dependencies

**Single binary. No database, no message broker.** Deploy anywhere in seconds—from your laptop to bare metal servers to Kubernetes. Everything is stored in plain files (XDG compliant), making it transparent, portable, and easy to backup.

### 🧩 Composable Nested Workflows

**Build complex pipelines from reusable building blocks.** Define sub-workflows that can be called with parameters, executed in parallel, and fully monitored in the UI. See execution traces for every nested level—no black boxes.

### 🌐 Language Agnostic

**Use your existing scripts without modification.** No need to wrap everything in Python decorators or rewrite logic. Dagu orchestrates shell commands, Docker containers, SSH commands, or HTTP calls—whatever you already have.

### ⚡ Distributed Execution

**Built-in queue system with intelligent task routing.** Route tasks to workers based on labels (GPU, region, compliance requirements). Automatic service registry and health monitoring included—no external coordination service needed.

### 🎯 Production Ready

**Not a toy.** Battle-tested error handling with exponential backoff retries, lifecycle hooks (onSuccess, onFailure, onExit), real-time log streaming, email notifications, Prometheus metrics, and OpenTelemetry tracing out of the box. Built-in user management with role-based access control (RBAC) for team environments.

### 🎨 Modern Web UI

**Beautiful UI that actually helps you debug.** Live log tailing, DAG visualization with Gantt charts, execution history with full lineage, and drill-down into nested sub-workflows. Dark mode included.

## Quick Start



### 1. Install dagu

**macOS/Linux**:

```bash
# Install to ~/.local/bin (default, no sudo required)
curl -L https://raw.githubusercontent.com/dagu-org/dagu/main/scripts/installer.sh | bash

# Install specific version
curl -L https://raw.githubusercontent.com/dagu-org/dagu/main/scripts/installer.sh | bash -s -- --version v1.17.0

# Install to custom directory
curl -L https://raw.githubusercontent.com/dagu-org/dagu/main/scripts/installer.sh | bash -s -- --install-dir /usr/local/bin

# Install to custom directory with custom working directory
curl -L https://raw.githubusercontent.com/dagu-org/dagu/main/scripts/installer.sh | bash -s -- --install-dir /usr/local/bin --working-dir /var/tmp
```

**Windows (PowerShell)**:

```powershell
# Install latest version to default location (%LOCALAPPDATA%\Programs\dagu)
irm https://raw.githubusercontent.com/dagu-org/dagu/main/scripts/installer.ps1 | iex

# Install specific version
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/dagu-org/dagu/main/scripts/installer.ps1))) v1.24.0

# Install to custom directory
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/dagu-org/dagu/main/scripts/installer.ps1))) latest "C:\tools\dagu"
```

**Windows (CMD/PowerShell)**:

```cmd
REM Install latest version to default location (%LOCALAPPDATA%\Programs\dagu)
curl -fsSL https://raw.githubusercontent.com/dagu-org/dagu/main/scripts/installer.cmd -o installer.cmd && .\installer.cmd && del installer.cmd

REM Install specific version
curl -fsSL https://raw.githubusercontent.com/dagu-org/dagu/main/scripts/installer.cmd -o installer.cmd && .\installer.cmd v1.24.0 && del installer.cmd

REM Install to custom directory
curl -fsSL https://raw.githubusercontent.com/dagu-org/dagu/main/scripts/installer.cmd -o installer.cmd && .\installer.cmd latest "C:\tools\dagu" && del installer.cmd
```

**Docker**:

```bash
docker run --rm \
  -v ~/.dagu:/var/lib/dagu \
  -p 8080:8080 \
  ghcr.io/dagu-org/dagu:latest \
  dagu start-all
```

Note: see [documentation](https://docs.dagu.cloud/getting-started/installation) for other methods.

**Homebrew**:

```bash
brew update && brew install dagu

# Upgrade to latest version
brew update && brew upgrade dagu
```

**npm**:

```bash
# Install via npm
npm install -g --ignore-scripts=false @dagu-org/dagu
```



### 2. Create your first workflow

> **Note**: When you first start Dagu with an empty DAGs directory, it automatically creates example workflows to help you get started. To skip this, set `DAGU_SKIP_EXAMPLES=true`.

```bash
cat > ./hello.yaml << 'EOF'
steps:
  - echo "Hello from Dagu!"
  - echo "Running step 2"
EOF
```



### 3. Run the workflow

```bash
dagu start hello.yaml
```



### 4. Check the status and view logs

```bash
dagu status hello
```



### 5. Explore the Web UI

```bash
dagu start-all
```

Visit [http://localhost:8080](http://localhost:8080)

## Docker-Compose

Clone the repository and run with Docker Compose:

```bash
git clone https://github.com/dagu-org/dagu.git
cd dagu
```

Run with minimal setup:

```bash
docker compose -f deploy/docker/compose.minimal.yaml up -d
# Visit http://localhost:8080
```

Stop containers:

```bash
docker compose -f deploy/docker/compose.minimal.yaml down
```

You can also use the production-like configuration `deploy/docker/compose.prod.yaml` with OpenTelemetry, Prometheus, and Grafana:

```bash
docker compose -f deploy/docker/compose.prod.yaml up -d
# Visit UI at http://localhost:8080
# Jaeger at http://localhost:16686, Prometheus at http://localhost:9090, Grafana at http://localhost:3000
```

Note: It's just for demonstration purposes. For production, please customize the configuration as needed.

For Kubernetes deployment, see the example manifests in `deploy/k8s/README.md`.

## Join our Developer Community

- Chat with us by joining our [Discord server](https://discord.gg/gpahPUjGRk)
- File bug reports and feature requests on our [GitHub Issues](https://github.com/dagu-org/dagu/issues)
- Follow us on [Bluesky](https://bsky.app/profile/dagu-org.bsky.social) for updates

For a detailed list of changes, bug fixes, and new features, please refer to the [Changelog](https://docs.dagu.cloud/reference/changelog).

## Documentation

Full documentation is available at [docs.dagu.cloud](https://docs.dagu.cloud/).

**Helpful Links**:

- [Feature by Examples](https://docs.dagu.cloud/writing-workflows/examples) - Explore useful features with examples
- [Remote Execution via SSH](https://docs.dagu.cloud/features/executors/ssh#ssh-executor) - Run commands on remote machines using SSH
- [Distributed Execution](https://docs.dagu.cloud/features/distributed-execution) - How to run workflows across multiple machines
- [Scheduling](https://docs.dagu.cloud/features/scheduling) - Learn about flexible scheduling options (start, stop, restart) with cron syntax
- [Authentication](https://docs.dagu.cloud/configurations/authentication) - Configure authentication for the Web UI
- [Configuration](https://docs.dagu.cloud/configurations/reference) - Detailed configuration options for customizing Dagu



## Environment Variables

**Note:** Configuration precedence: Command-line flags > Environment variables > Configuration file

### Frontend Server Configuration


| Environment Variable       | Default     | Description                          |
| -------------------------- | ----------- | ------------------------------------ |
| `DAGU_HOST`                | `127.0.0.1` | Web UI server host                   |
| `DAGU_PORT`                | `8080`      | Web UI server port                   |
| `DAGU_BASE_PATH`           | -           | Base path for reverse proxy setup    |
| `DAGU_API_BASE_URL`        | `/api/v2`   | API endpoint base path               |
| `DAGU_TZ`                  | -           | Server timezone (e.g., `Asia/Tokyo`) |
| `DAGU_DEBUG`               | `false`     | Enable debug mode                    |
| `DAGU_LOG_FORMAT`          | `text`      | Log format (`text` or `json`)        |
| `DAGU_HEADLESS`            | `false`     | Run without Web UI                   |
| `DAGU_LATEST_STATUS_TODAY` | `false`     | Show only today's latest status      |
| `DAGU_WORK_DIR`            | -           | Default working directory for DAGs   |
| `DAGU_DEFAULT_SHELL`       | -           | Default shell for command execution  |
| `DAGU_CERT_FILE`           | -           | TLS certificate file path            |
| `DAGU_KEY_FILE`            | -           | TLS key file path                    |




### Path Configuration


| Environment Variable        | Default                          | Description                                           |
| --------------------------- | -------------------------------- | ----------------------------------------------------- |
| `DAGU_HOME`                 | -                                | Base directory that overrides all path configurations |
| `DAGU_DAGS_DIR`             | `~/.config/dagu/dags`            | Directory for DAG definitions                         |
| `DAGU_LOG_DIR`              | `~/.local/share/dagu/logs`       | Directory for log files                               |
| `DAGU_DATA_DIR`             | `~/.local/share/dagu/data`       | Directory for application data                        |
| `DAGU_SUSPEND_FLAGS_DIR`    | `~/.local/share/dagu/suspend`    | Directory for suspend flags                           |
| `DAGU_ADMIN_LOG_DIR`        | `~/.local/share/dagu/logs/admin` | Directory for admin logs                              |
| `DAGU_BASE_CONFIG`          | `~/.config/dagu/base.yaml`       | Path to base configuration file                       |
| `DAGU_EXECUTABLE`           | -                                | Path to dagu executable                               |
| `DAGU_DAG_RUNS_DIR`         | `{dataDir}/dag-runs`             | Directory for DAG run data                            |
| `DAGU_PROC_DIR`             | `{dataDir}/proc`                 | Directory for process data                            |
| `DAGU_QUEUE_DIR`            | `{dataDir}/queue`                | Directory for queue data                              |
| `DAGU_SERVICE_REGISTRY_DIR` | `{dataDir}/service-registry`     | Directory for service registry                        |




### Authentication


| Environment Variable           | Default | Description                                       |
| ------------------------------ | ------- | ------------------------------------------------- |
| `DAGU_AUTH_MODE`               | `none`  | Authentication mode: `none`, `builtin`, or `oidc` |
| `DAGU_AUTH_BASIC_USERNAME`     | -       | Basic auth username                               |
| `DAGU_AUTH_BASIC_PASSWORD`     | -       | Basic auth password                               |
| `DAGU_AUTH_OIDC_CLIENT_ID`     | -       | OIDC client ID                                    |
| `DAGU_AUTH_OIDC_CLIENT_SECRET` | -       | OIDC client secret                                |
| `DAGU_AUTH_OIDC_CLIENT_URL`    | -       | OIDC client URL                                   |
| `DAGU_AUTH_OIDC_ISSUER`        | -       | OIDC issuer URL                                   |
| `DAGU_AUTH_OIDC_SCOPES`        | -       | OIDC scopes (comma-separated)                     |
| `DAGU_AUTH_OIDC_WHITELIST`     | -       | OIDC email whitelist (comma-separated)            |




### Builtin Authentication (RBAC)

When `DAGU_AUTH_MODE=builtin`, a file-based user management system with role-based access control is enabled. Roles: `admin`, `manager`, `operator`, `viewer`.


| Environment Variable       | Default           | Description                             |
| -------------------------- | ----------------- | --------------------------------------- |
| `DAGU_AUTH_ADMIN_USERNAME` | `admin`           | Initial admin username                  |
| `DAGU_AUTH_ADMIN_PASSWORD` | (auto-generated)  | Initial admin password                  |
| `DAGU_AUTH_TOKEN_SECRET`   | -                 | JWT token secret for signing (required) |
| `DAGU_AUTH_TOKEN_TTL`      | `24h`             | JWT token time-to-live                  |
| `DAGU_USERS_DIR`           | `{dataDir}/users` | Directory for user data files           |




### UI Configuration


| Environment Variable               | Default   | Description                   |
| ---------------------------------- | --------- | ----------------------------- |
| `DAGU_UI_NAVBAR_COLOR`             | `#1976d2` | UI header color (hex or name) |
| `DAGU_UI_NAVBAR_TITLE`             | `Dagu`    | UI header title               |
| `DAGU_UI_LOG_ENCODING_CHARSET`     | `utf-8`   | Log file encoding             |
| `DAGU_UI_MAX_DASHBOARD_PAGE_LIMIT` | `100`     | Maximum items on dashboard    |
| `DAGU_UI_DAGS_SORT_FIELD`          | `name`    | Default DAGs sort field       |
| `DAGU_UI_DAGS_SORT_ORDER`          | `asc`     | Default DAGs sort order       |




### Scheduler Configuration


| Environment Variable                       | Default | Description                                  |
| ------------------------------------------ | ------- | -------------------------------------------- |
| `DAGU_SCHEDULER_PORT`                      | `8090`  | Health check server port                     |
| `DAGU_SCHEDULER_LOCK_STALE_THRESHOLD`      | `30s`   | Scheduler lock stale threshold               |
| `DAGU_SCHEDULER_LOCK_RETRY_INTERVAL`       | `5s`    | Lock retry interval                          |
| `DAGU_SCHEDULER_ZOMBIE_DETECTION_INTERVAL` | `45s`   | Zombie DAG detection interval (0 to disable) |
| `DAGU_QUEUE_ENABLED`                       | `true`  | Enable queue system                          |




### Worker Configuration

This configuration is used for worker instances that execute DAGs. See the [Distributed Execution](https://docs.dagu.cloud/features/distributed-execution) documentation for more details.


| Environment Variable                  | Default     | Description                                                                    |
| ------------------------------------- | ----------- | ------------------------------------------------------------------------------ |
| `DAGU_COORDINATOR_HOST`               | `127.0.0.1` | Coordinator gRPC server bind address                                           |
| `DAGU_COORDINATOR_ADVERTISE`          | (auto)      | Address to advertise in service registry (default: hostname)                   |
| `DAGU_COORDINATOR_PORT`               | `50055`     | Coordinator gRPC server port                                                   |
| `DAGU_WORKER_ID`                      | -           | Worker instance ID                                                             |
| `DAGU_WORKER_MAX_ACTIVE_RUNS`         | `100`       | Maximum concurrent runs per worker                                             |
| `DAGU_WORKER_LABELS`                  | -           | Worker labels (format: `key1=value1,key2=value2`, e.g., `gpu=true,memory=64G`) |
| `DAGU_SCHEDULER_PORT`                 | `8090`      | Scheduler health check server port                                             |
| `DAGU_SCHEDULER_LOCK_STALE_THRESHOLD` | `30s`       | Time after which scheduler lock is considered stale                            |
| `DAGU_SCHEDULER_LOCK_RETRY_INTERVAL`  | `5s`        | Interval between lock acquisition attempts                                     |




### Peer Configuration

This configuration is used for communication between coordinator services and other services (e.g., scheduler, worker, web UI). See the [Distributed Execution](https://docs.dagu.cloud/features/distributed-execution) documentation for more details.


| Environment Variable        | Default | Description                                            |
| --------------------------- | ------- | ------------------------------------------------------ |
| `DAGU_PEER_CERT_FILE`       | -       | Peer TLS certificate file                              |
| `DAGU_PEER_KEY_FILE`        | -       | Peer TLS key file                                      |
| `DAGU_PEER_CLIENT_CA_FILE`  | -       | Peer CA certificate file for client verification       |
| `DAGU_PEER_SKIP_TLS_VERIFY` | `false` | Skip TLS certificate verification for peer connections |
| `DAGU_PEER_INSECURE`        | `true`  | Use insecure connection (h2c) instead of TLS           |




## Development



### Building from Source



#### Prerequisites

- [Go 1.25+](https://go.dev/doc/install)
- [Node.js](https://nodejs.org/en/download/)
- [pnpm](https://pnpm.io/installation)



#### 1. Clone the repository and build server

```bash
git clone https://github.com/dagu-org/dagu.git && cd dagu
make
```

This will start the dagu server at [http://localhost:8080](http://localhost:8080).

#### 2. Run the frontend development server

```bash
cd ui
pnpm install
pnpm dev
```

Navigate to [http://localhost:8081](http://localhost:8081) to view the frontend.

### Running Tests

To ensure the integrity of the go code, you can run all Go unit and integration tests.

Run all tests from the project root directory:

```bash
make test
```

To run tests with code coverage analysis:

```bash
make make-coverage
```



## Features

This section outlines the current capabilities of Dagu.


| Category                   | Capability                      | Description                                                          | Link                                                                                                                                                                             |
| -------------------------- | ------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core Execution & Lifecycle | Local execution                 | Run workflows locally with CLI / Web UI / API                        | [CLI](https://docs.dagu.cloud/overview/cli), [Web UI](https://docs.dagu.cloud/overview/web-ui), [API](https://docs.dagu.cloud/overview/api)                                      |
|                            | Queue based execution           | Dispatch DAG execution to workers with labels and priorities         | [Queues](https://docs.dagu.cloud/features/queues)                                                                                                                                |
|                            | Immediate execution             | Disable queue for immediate execution                                | [CLI](https://docs.dagu.cloud/overview/cli)                                                                                                                                      |
|                            | Idempotency                     | Prevent duplicate DAG execution with same DAG-run ID                 | [`start` command](https://docs.dagu.cloud/reference/cli#status)                                                                                                                  |
|                            | Status management               | queued → running → succeeded/partially_succeeded/failed/aborted      | [Status Management](http://localhost:5173/getting-started/concepts#status-management)                                                                                            |
|                            | Cancel propagation              | Cancel signals to sub-DAG                                            |                                                                                                                                                                                  |
|                            | Cleanup hooks                   | Define cleanup processing with onExit handlers                       | [Lifecycle Handlers](https://docs.dagu.cloud/getting-started/concepts#lifecycle-handlers)                                                                                        |
|                            | Status hooks                    | Define hooks on success / failure / cancel                           | [Lifecycle Handlers](https://docs.dagu.cloud/getting-started/concepts#lifecycle-handlers)                                                                                        |
| Definition & Templates     | Declarative YAML DSL            | Validation with JSON Schema, display error locations                 | [YAML Specification](https://docs.dagu.cloud/reference/yaml)                                                                                                                     |
|                            | Environment variables           | Environment variables at DAG and step level, support dotenv          | [Environment Variables](https://docs.dagu.cloud/writing-workflows/data-variables#environment-variables)                                                                          |
|                            | Command substitution            | Use command output as value for variables or parameters              | [Command Substitution](https://docs.dagu.cloud/reference/variables#command-substitution)                                                                                         |
|                            | Shell support                   | Use shell features like pipes, redirects, globbing, etc.             | [Shell Executor](https://docs.dagu.cloud/features/executors/shell)                                                                                                               |
|                            | Script support                  | Use scripts in Python, Bash, etc. as steps                           | [Script Execution](https://docs.dagu.cloud/writing-workflows/examples#scripts-code)                                                                                              |
|                            | Modular DAGs                    | Reusable DAGs with params                                            | [Base Configuration](https://docs.dagu.cloud/writing-workflows/#base-configuration), [Parallel Execution](https://docs.dagu.cloud/features/execution-control#parallel-execution) |
|                            | Secrets management              | Reference-only secrets via KMS/Vault/OIDC                            | [Secrets](https://docs.dagu.io/writing-workflows/secrets)                                                                                                                        |
| Control Structures         | Fan-out/Fan-in                  | Native parallel branches + join                                      | [Parallel Execution](https://docs.dagu.cloud/writing-workflows/control-flow#parallel-execution)                                                                                  |
|                            | Iteration (loop)                | Iteration over list values                                           | [Parallel Execution](https://docs.dagu.cloud/writing-workflows/control-flow#parallel-execution)                                                                                  |
|                            | Conditional routes              | Data/expression based routing                                        | [Conditional Execution](https://docs.dagu.cloud/writing-workflows/control-flow#conditional-execution)                                                                            |
|                            | Sub-DAG call                    | Reusable sub-DAG                                                     | [Parallel Execution](https://docs.dagu.cloud/features/execution-control#parallel-execution)                                                                                      |
|                            | Worker & Dispatch               | Runs DAG on different nodes with selector conditions                 | [Distributed Execution](https://docs.dagu.cloud/features/distributed-execution)                                                                                                  |
|                            | Retry policies                  | Retry with backoff/interval                                          | [Retry Policies](https://docs.dagu.cloud/writing-workflows/error-handling#retry-policies)                                                                                        |
|                            | Repeat Policies                 | Repeat step until condition is met                                   | [Repeat Policies](https://docs.dagu.cloud/writing-workflows/control-flow#repetition)                                                                                             |
|                            | Timeout management              | DAG Execution Timeouts                                               | [Workflow Timeout](https://docs.dagu.cloud/features/execution-control#workflow-timeout)                                                                                          |
| Triggers & Scheduling      | Cron expression                 | Schedule to start / stop / restart                                   | [Scheduling](https://docs.dagu.cloud/features/scheduling)                                                                                                                        |
|                            | Multiple schedules              | Multiple schedules per DAG                                           | [Multiple Schedules](https://docs.dagu.cloud/features/scheduling#multiple-schedules)                                                                                             |
|                            | Timezone support                | Per-DAG timezone for cron schedules                                  | [Timezone Support](https://docs.dagu.cloud/features/scheduling#timezone-support)                                                                                                 |
|                            | Skip                            | Skip an execution when a previous manual run was successful          | [Skip Redundant Runs](https://docs.dagu.cloud/features/scheduling#skip-redundant-runs)                                                                                           |
|                            | Zombie detection                | Automatic detection for processes terminated unexpectedly            | [Scheduling](https://docs.dagu.cloud/features/scheduling)                                                                                                                        |
|                            | Trigger via Web API             | Web API to start DAG executions                                      | [Web API](https://docs.dagu.cloud/overview/api)                                                                                                                                  |
| Container Native Execution | Step-level container config     | Run steps in Docker containers with granular control                 | [Docker Executor](https://docs.dagu.cloud/features/executors/docker)                                                                                                             |
|                            | DAG level container config      | Run all steps in a container with shared volumes and env vars        | [Container Field](https://docs.dagu.cloud/features/executors/docker#container-field)                                                                                             |
|                            | Authorized registry access      | Access private registries with credentials                           | [Registry Auth](https://docs.dagu.cloud/features/executors/docker#registry-authentication)                                                                                       |
| Data & Artifacts           | Passing data between steps      | Passing ephemeral data between steps in a DAG                        | [Data Flow](https://docs.dagu.cloud/features/data-flow)                                                                                                                          |
|                            | Secret redaction                | Auto-mask secrets in logs/events                                     |                                                                                                                                                                                  |
|                            | Automatic log cleanup           | Automatic log cleanup based on retention policies                    | [Log Retention](https://docs.dagu.cloud/configurations/operations#log-cleanup)                                                                                                   |
| Observability              | Logging with live streaming     | Structured JSON logs with live tail streaming                        | [Log Viewer](https://docs.dagu.cloud/overview/web-ui#log-viewer)                                                                                                                 |
|                            | Metrics                         | Prometheus metrics                                                   | [Metrics](https://docs.dagu.cloud/configurations/reference#metrics)                                                                                                              |
|                            | OpenTelemetry                   | Distributed tracing with OpenTelemetry                               | [OpenTelemetry](https://docs.dagu.cloud/features/opentelemetry)                                                                                                                  |
|                            | DAG Visualization               | DAG / Gantt charts for critical path analysis                        | [DAG Visualization](https://docs.dagu.cloud/overview/web-ui#dag-visualization)                                                                                                   |
|                            | Email notification              | Email notification on success / failure with the log file attachment | [Email Notifications](https://docs.dagu.cloud/features/email-notifications)                                                                                                      |
|                            | Health monitoring               | Health check for scheduler & failover                                | [Health Check](https://docs.dagu.cloud/configurations/reference#health-check)                                                                                                    |
|                            | Nested-DAG visualization        | Nested DAG visualization with drill down functionality               | [Nested DAG Visualization](https://docs.dagu.cloud/overview/web-ui#nested-dag-visualization)                                                                                     |
| Security & Governance      | Secret injection                | Vault/KMS/OIDC ref-only; short-lived tokens                          | [Secrets](https://docs.dagu.cloud/writing-workflows/secrets)                                                                                                                     |
|                            | Authentication                  | Basic auth / OIDC / Builtin (JWT) support for Web UI and API         | [Authentication](https://docs.dagu.cloud/configurations/authentication)                                                                                                          |
|                            | Role-based access control       | Builtin RBAC with admin, manager, operator, viewer roles             |                                                                                                                                                                                  |
|                            | User management                 | Create, update, delete users with role assignment                    |                                                                                                                                                                                  |
|                            | HA (High availability) mode     | Control-plane with failover for scheduler / Web UI / Coordinator     | [High Availability](https://docs.dagu.cloud/features/scheduling#high-availability)                                                                                               |
| Executor types             | `jq`                            | JSON processing with jq queries                                      | [JQ Executor](https://docs.dagu.cloud/features/executors/jq)                                                                                                                     |
|                            | `ssh`                           | Remote command execution via SSH                                     | [SSH Executor](https://docs.dagu.cloud/features/executors/ssh)                                                                                                                   |
|                            | `docker`                        | Container-based task execution                                       | [Docker Executor](https://docs.dagu.cloud/features/executors/docker)                                                                                                             |
|                            | `http`                          | HTTP/REST API calls with retry                                       | [HTTP Executor](https://docs.dagu.cloud/features/executors/http)                                                                                                                 |
|                            | `mail`                          | Send emails with template                                            | [Mail Executor](https://docs.dagu.cloud/features/executors/mail)                                                                                                                 |
|                            | `archive`                       | Archive/unarchive operations (zip, tar, etc.)                        | [Archive Executor](https://docs.dagu.cloud/features/executors/archive)                                                                                                           |
| DevX & Testing             | Local development               | offline runs                                                         | [CLI Usage](https://docs.dagu.cloud/overview/cli)                                                                                                                                |
|                            | Dry-run                         | DAG level Dry-run                                                    | [`dry` command](https://docs.dagu.cloud/reference/cli#dry)                                                                                                                       |
| UI & Operations            | Run / retry / cancel operations | Start / enqueue / retry / stop                                       | [DAG Operations](https://docs.dagu.cloud/overview/web-ui#dag-operations)                                                                                                         |
|                            | Automatic parameter forms       | Auto-generate parameter forms for DAGs                               | [Web UI](https://docs.dagu.cloud/overview/web-ui)                                                                                                                                |
|                            | DAG definition search           | Filter by tag / name                                                 | [DAG Search](https://docs.dagu.cloud/overview/web-ui#search)                                                                                                                     |
|                            | Execution history search        | Filter by status / date-range / name                                 | [History Search](https://docs.dagu.cloud/overview/web-ui#history)                                                                                                                |
|                            | Step-level operations           | Rerun, resume from step                                              | [Web UI](https://docs.dagu.cloud/overview/web-ui)                                                                                                                                |
|                            | Parameter override              | Override parameters for a DAG run                                    |                                                                                                                                                                                  |
|                            | Scheduled DAG management        | Enable/disable schedule for a DAG                                    | [Web UI](https://docs.dagu.cloud/overview/web-ui)                                                                                                                                |
|                            | UI organization                 | Logical DAG grouping                                                 | [DAG Organization](https://docs.dagu.cloud/overview/web-ui#dag-organization)                                                                                                     |
| Others                     | Windows support                 | Windows support                                                      |                                                                                                                                                                                  |




## Roadmap

This section outlines the planned features for Dagu.

**Legend:**

- Status: 🏗️ In Progress / 📋 Planned / 💭 Designing / ⛔ Blocked / 🏢 Enterprise
- Priority: P0 = Must have / P1 = Should have / P2 = Could have


| Category                   | Capability                     | Description                                                              | Status | Priority | Link                                                                                                                                                          |
| -------------------------- | ------------------------------ | ------------------------------------------------------------------------ | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Definition & Templates     | Variables store                | Env-scoped variables                                                     | 💭     | P1       |                                                                                                                                                               |
|                            | Code-based SDK                 | Python / Go / TS SDK to build DAG programmatically                       | 💭     | P2       | [#583](https://github.com/dagu-org/dagu/issues/583)                                                                                                           |
|                            | Go template support            | Use Go templates in DAG definitions                                      | 💭     | P2       | [#738](https://github.com/dagu-org/dagu/issues/738)                                                                                                           |
| Control Structures         | Matrix runs                    | Create all parameter combinations                                        | 💭     | P1       | [#879](https://github.com/dagu-org/dagu/issues/879), [#990](https://github.com/dagu-org/dagu/issues/990)                                                      |
|                            | Human-in-the-loop              | Wait for human approval / input                                          | 💭     | P0       | [#978](https://github.com/dagu-org/dagu/issues/978)                                                                                                           |
| Triggers & Scheduling      | Second-precision cron          | Per-DAG TZ, holiday calendar, exclusion windows                          | 💭     | P2       | [#676](https://github.com/dagu-org/dagu/issues/676)                                                                                                           |
|                            | Sunset/Sunrise triggers        | Trigger DAG on sunrise/sunset events                                     | 💭     | P2       | [#1004](https://github.com/dagu-org/dagu/issues/1004)                                                                                                         |
|                            | Catch up                       | Catch up on missed executions with safety caps                           | 💭     | P0       | [#695](https://github.com/dagu-org/dagu/issues/695)                                                                                                           |
|                            | Overlap                        | Overlap policy (skip/queue/cancel)                                       | 📋     | P1       |                                                                                                                                                               |
|                            | Queue Override                 | Override queue for specific runs                                         | 📋     | P0       | [#1111](https://github.com/dagu-org/dagu/issues/1111)                                                                                                         |
|                            | Backfill                       | Historical range runs with safety caps                                   | 💭     | P2       | [#695](https://github.com/dagu-org/dagu/issues/695)                                                                                                           |
|                            | File watcher trigger           | Trigger DAG on file changes in a directory                               | 💭     | P0       | [#372](https://github.com/dagu-org/dagu/issues/372)                                                                                                           |
|                            | Holiday calendars              | Import & reference holiday calendars                                     | 💭     | P2       | [#676](https://github.com/dagu-org/dagu/issues/676)                                                                                                           |
| Container Native Execution | On-the-fly image build         | Builds image on-the-fly during DAG execution                             | 📋     | P0       |                                                                                                                                                               |
|                            | Kubernetes native execution    | Run steps as Kubernetes jobs/pods                                        | 💭     | P0       | [#837](https://github.com/dagu-org/dagu/issues/837)                                                                                                           |
| Resource Management        | Resource limits                | CPU/Memory/IO requests & limits per-step                                 | 💭     | P0       |                                                                                                                                                               |
|                            | Rate limiting                  | Token bucket per key/endpoint for external APIs                          | 💭     | P1       |                                                                                                                                                               |
|                            | Distributed locks              | Keyed semaphore for exclusivity                                          | 💭     | P0       |                                                                                                                                                               |
| Data & Artifacts           | JSON Schema validation         | Parameter validation with JSON Schema                                    | 💭     | P0       | [#325](https://github.com/dagu-org/dagu/issues/325)                                                                                                           |
|                            | External storage               | Stream large logs/artifacts to S3/GCS/Azure                              | 💭     | P2       | [#640](https://github.com/dagu-org/dagu/issues/640), [#548](https://github.com/dagu-org/dagu/issues/548), [#267](https://github.com/dagu-org/dagu/issues/267) |
|                            | Inter DAG-run state management | Manage state and data sharing between DAG-runs                           | 💭     | P0       |                                                                                                                                                               |
|                            | Database backend support       | Support for external databases (PostgreSQL, MySQL) instead of filesystem | 💭     | P1       | [#539](https://github.com/dagu-org/dagu/issues/539), [#267](https://github.com/dagu-org/dagu/issues/267)                                                      |
| Observability              | Resource usage monitoring      | CPU/Memory/IO usage per DAG/step with live graphs                        | 💭     | P0       | [#546](https://github.com/dagu-org/dagu/issues/546)                                                                                                           |
| Security & Governance      | Fine-grained permissions       | DAG-level and resource-level permissions                                 | 🏢     |          |                                                                                                                                                               |
|                            | Resource quotas                | CPU time and memory limit                                                | 📋     | P0       |                                                                                                                                                               |
|                            | Audit trail                    | Immutable events for all manual actions                                  | 🏢     |          |                                                                                                                                                               |
|                            | Audit logging                  | Immutable who/what/when records (WORM)                                   | 🏢     |          |                                                                                                                                                               |
| Executor types             | `database`                     | Direct database read/write operations                                    | 💭     | P2       | [#789](https://github.com/dagu-org/dagu/issues/789)                                                                                                           |
|                            | `ftp`                          | File transfer protocol support                                           | 💭     | P2       | [#1079](https://github.com/dagu-org/dagu/issues/1079)                                                                                                         |
|                            | Custom plugin system           | Custom executor types                                                    | 💭     | P1       | [#583](https://github.com/dagu-org/dagu/issues/583)                                                                                                           |
| DevX & Testing             | Debug mode                     | debug mode for step-by-step DAG execution                                | 💭     | P1       | [#1119](https://github.com/dagu-org/dagu/issues/1119)                                                                                                         |
|                            | Static analysis                | DAG Validation tool                                                      | 💭     | P0       | [#325](https://github.com/dagu-org/dagu/issues/325)                                                                                                           |
|                            | Migration helpers              | Provide migration helpers from cron-only DAGs to full scheduler          | 💭     | P1       | [#448](https://github.com/dagu-org/dagu/issues/448)                                                                                                           |
| UI & Operations            | Pause / resume operations      | Pause / resume DAG executions                                            | 💭     | P0       |                                                                                                                                                               |
|                            | Run single step                | Run a single step in a DAG                                               | 💭     | P0       | [#1047](https://github.com/dagu-org/dagu/issues/1047)                                                                                                         |
|                            | Edit & retry                   | Edit DAG definition before retrying a run                                | 💭     | P0       | [#326](https://github.com/dagu-org/dagu/issues/326), [#1058](https://github.com/dagu-org/dagu/issues/1058)                                                    |
|                            | Version control                | Diff/compare/rollback DAG definitions                                    | 💭     | P2       | [#320](https://github.com/dagu-org/dagu/issues/320), [#374](https://github.com/dagu-org/dagu/issues/374)                                                      |
| Others                     | Snap packaging                 | Snap packaging                                                           | 📋     | P1       | [#821](https://github.com/dagu-org/dagu/issues/821), [#871](https://github.com/dagu-org/dagu/issues/871)                                                      |




## Discussion

For discussions, support, and sharing ideas, join our community on [Discord](https://discord.gg/gpahPUjGRk).

## Recent Updates

Changelog of recent updates can be found in the [Changelog](https://docs.dagu.cloud/reference/changelog) section of the documentation.

## Acknowledgements

