# Agent Coding Guide

A file for [guiding coding agents](https://agents.md/).

## Project Structure & Module Organization
- Backend entrypoint in `cmd/` orchestrates the scheduler and CLI; runtime, persistence, and service layers sit under `internal/*` (for example `internal/runtime`, `internal/persistence`).
- API definitions live in `api/v1` and `api/v2`; generated server stubs land in `internal/service`, while matching TypeScript clients flow into `ui/src/api`.
- The React + TypeScript frontend resides in `ui/`, with production bundles copied to `internal/service/frontend/assets` by `make ui`.
- Shared assets, docs, proto schemas, and scripts are grouped in `assets/`, `docs/`, `proto/`, and `scripts/`; integration fixtures live in `internal/test` and `internal/testdata`.

## Build, Test, and Development Commands
- `make run` starts the Go scheduler and serves the compiled UI (fails fast if `ui/dist` is missing).
- `make bin` creates a local `dagu` binary under `.local/bin/` with version metadata baked in.
- `make lint` installs `golangci-lint` to `.local/bin` and runs it across `./...`.
- `make test` (or `make test-coverage`) executes the Go suite via `gotestsum`; append `TEST_TARGET=./internal/...` to focus packages.
- Frontend workflows: `cd ui && pnpm dev` for hot reload, `pnpm build` for production bundles, `pnpm lint` to auto-fix TypeScript/React style issues.

## Coding Style & Naming Conventions
- Keep Go files `gofmt`/`goimports` clean; use tabs, PascalCase for exported symbols (`SchedulerClient`), lowerCamelCase for locals, and `Err...` names for package-level errors.
- Repository linting relies on `golangci-lint`; prefer idiomatic Go patterns, minimal global state, and structured logging helpers in `internal/common`.
- UI code follows ESLint + Prettier (2-space indent) and Tailwind utilities; name React components in PascalCase (`JobList.tsx`) and hooks with `use*` (`useJobs.ts`).

## Testing Guidelines
- Co-locate Go tests as `*_test.go`; favour table-driven cases and cover failure paths.
- Use `stretchr/testify/require` and shared fixtures from `internal/test` instead of duplicating mocks.
- Run `make test-coverage` for coverage targets and `make open-coverage` to inspect the HTML report before merging.

## Commit & Pull Request Guidelines
- Commit summaries follow the Go convention `package: change` (lowercase package or area, present tense summary); keep body paragraphs wrapped at 72 chars when needed.
- Verify `make lint` and `make test` locally; include unit or integration tests whenever behaviour or APIs change.
- PR descriptions must link related issues, outline risk areas, and attach UI screenshots or sample payloads when touching `ui/` or `api/` schemas.
- Use the template at `.github/pull_request_template.md` for every PR; keep all checklist items addressed or justify unchecked boxes in the Additional Notes.
- Call out configuration edits (e.g., under `config/` or cert tooling in `Makefile`) so reviewers can validate deployment impact.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **dagu** (11727 symbols, 47667 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/dagu/context` | Codebase overview, check index freshness |
| `gitnexus://repo/dagu/clusters` | All functional areas |
| `gitnexus://repo/dagu/processes` | All execution flows |
| `gitnexus://repo/dagu/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
