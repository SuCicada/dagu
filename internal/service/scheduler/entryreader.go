package scheduler

import (
	"context"
	"fmt"
	"io/fs"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/dagu-org/dagu/internal/common/fileutil"
	"github.com/dagu-org/dagu/internal/common/logger"
	"github.com/dagu-org/dagu/internal/common/logger/tag"
	"github.com/dagu-org/dagu/internal/core"
	"github.com/dagu-org/dagu/internal/core/execution"
	"github.com/dagu-org/dagu/internal/core/spec"
	"github.com/dagu-org/dagu/internal/runtime"
	"github.com/dagu-org/dagu/internal/service/scheduler/filenotify"
	"github.com/robfig/cron/v3"

	"github.com/fsnotify/fsnotify"
)

// EntryReader is responsible for managing scheduled Jobs.
type EntryReader interface {
	// Init initializes the DAG registry by loading all DAGs from the target directory.
	// This must be called before Start or Next.
	Init(ctx context.Context) error
	// Start starts watching the DAG directory for changes.
	// This method blocks until Stop is called or context is canceled.
	Start(ctx context.Context)
	// Stop stops watching the DAG directory.
	Stop()
	// Next returns the next scheduled jobs.
	Next(ctx context.Context, now time.Time) ([]*ScheduledJob, error)
}

// ScheduledJob stores the next time a job should be run and the job itself.
type ScheduledJob struct {
	Next time.Time // Next is the time when the job should be run.
	Job  Job
	Type ScheduleType // start, stop, restart
}

// NewScheduledJob creates a new ScheduledJob.
func NewScheduledJob(next time.Time, job Job, typ ScheduleType) *ScheduledJob {
	return &ScheduledJob{next, job, typ}
}

var _ EntryReader = (*entryReaderImpl)(nil)

// entryReaderImpl manages DAGs on local filesystem.
type entryReaderImpl struct {
	targetDir   string
	registry    map[string]*core.DAG
	lock        sync.Mutex
	dagStore    execution.DAGStore
	dagRunMgr   runtime.Manager
	executable  string
	dagExecutor *DAGExecutor
	watcher     filenotify.FileWatcher
	quit        chan struct{}
	closeOnce   sync.Once
}

// NewEntryReader creates a new DAG manager with the given configuration.
func NewEntryReader(dir string, dagCli execution.DAGStore, drm runtime.Manager, de *DAGExecutor, executable string) EntryReader {
	return &entryReaderImpl{
		targetDir:   dir,
		lock:        sync.Mutex{},
		registry:    map[string]*core.DAG{},
		dagStore:    dagCli,
		dagRunMgr:   drm,
		executable:  executable,
		dagExecutor: de,
		quit:        make(chan struct{}),
	}
}

func (er *entryReaderImpl) Init(ctx context.Context) error {
	er.lock.Lock()
	defer er.lock.Unlock()

	if err := er.initialize(ctx); err != nil {
		logger.Error(ctx, "Failed to initialize DAG registry", tag.Error(err))
		return fmt.Errorf("failed to initialize DAGs: %w", err)
	}

	// Create and configure the file watcher
	er.watcher = filenotify.New(time.Minute)
	if err := er.addWatchDirs(er.targetDir); err != nil {
		_ = er.watcher.Close()
		return fmt.Errorf("failed to watch DAG directories under %s: %w", er.targetDir, err)
	}

	return nil
}

func (er *entryReaderImpl) Start(ctx context.Context) {
	for {
		select {
		case <-er.quit:
			return

		case <-ctx.Done():
			return

		case event, ok := <-er.watcher.Events():
			if !ok {
				return
			}

			// 为了子目录
			if event.Op == fsnotify.Create {
				if fi, err := os.Stat(event.Name); err == nil && fi.IsDir() {
					if err := er.addWatchDirs(event.Name); err != nil {
						logger.Error(ctx, "Failed to watch DAG directory",
							tag.Dir(event.Name),
							tag.Error(err))
					}
					continue
				}
			}

			if !fileutil.IsYAMLFile(event.Name) {
				continue
			}

			er.lock.Lock()
			if event.Op == fsnotify.Create || event.Op == fsnotify.Write {
				dag, err := er.loadDAG(ctx, event.Name)
				if err != nil {
					logger.Error(ctx, "DAG load failed",
						tag.Error(err),
						tag.File(event.Name))
				} else {
					key := er.registryKey(event.Name)
					er.registry[key] = dag
					logger.Info(ctx, "DAG added/updated", tag.Name(key))
				}
			}
			if event.Op == fsnotify.Rename || event.Op == fsnotify.Remove {
				key := er.registryKey(event.Name)
				delete(er.registry, key)
				logger.Info(ctx, "DAG removed", tag.Name(key))
			}
			er.lock.Unlock()

		case err, ok := <-er.watcher.Errors():
			if !ok {
				return
			}
			logger.Error(ctx, "Watcher error", tag.Error(err))
		}
	}
}

func (er *entryReaderImpl) Stop() {
	er.lock.Lock()
	defer er.lock.Unlock()

	er.closeOnce.Do(func() {
		close(er.quit)
		if er.watcher != nil {
			_ = er.watcher.Close()
		}
	})
}

func (er *entryReaderImpl) Next(ctx context.Context, now time.Time) ([]*ScheduledJob, error) {
	er.lock.Lock()
	defer er.lock.Unlock()

	var jobs []*ScheduledJob

	for _, dag := range er.registry {
		dagName := dag.Name
		if dagName == "" {
			dagName = strings.TrimSuffix(filepath.Base(dag.Location), filepath.Ext(dag.Location))
		}
		if er.dagStore.IsSuspended(ctx, dagName) {
			logger.Debug(ctx, "Skipping suspended DAG", tag.DAG(dagName))
			continue
		}

		schedules := []struct {
			items []core.Schedule
			typ   ScheduleType
		}{
			{dag.Schedule, ScheduleTypeStart},
			{dag.StopSchedule, ScheduleTypeStop},
			{dag.RestartSchedule, ScheduleTypeRestart},
		}

		for _, s := range schedules {
			for _, schedule := range s.items {
				next := schedule.Parsed.Next(now)
				job := NewScheduledJob(next, er.createJob(dag, next, schedule.Parsed), s.typ)
				jobs = append(jobs, job)
			}
		}
	}

	return jobs, nil
}

func (er *entryReaderImpl) createJob(dag *core.DAG, next time.Time, schedule cron.Schedule) Job {
	return &DAGRunJob{
		DAG:         dag,
		Next:        next,
		Schedule:    schedule,
		Client:      er.dagRunMgr,
		DAGExecutor: er.dagExecutor,
	}
}

func (er *entryReaderImpl) initialize(ctx context.Context) error {
	// Note: This method expects the caller to already hold er.lock
	logger.Info(ctx, "Loading DAGs", tag.Dir(er.targetDir))
	var dags []string
	if err := filepath.WalkDir(er.targetDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			logger.Error(ctx, "Failed to read DAG path",
				tag.File(path),
				tag.Error(err),
			)
			return nil
		}
		if d.IsDir() || !fileutil.IsYAMLFile(path) {
			return nil
		}
		dag, err := er.loadDAG(ctx, path)
		key := er.registryKey(path)
		if err != nil {
			logger.Error(ctx, "DAG load failed",
				tag.Error(err),
				tag.Name(key))
			return nil
		}
		er.registry[key] = dag
		dags = append(dags, key)
		return nil
	}); err != nil {
		logger.Error(ctx, "Failed to walk DAG directory",
			tag.Dir(er.targetDir),
			tag.Error(err),
		)
		return err
	}

	logger.Info(ctx, "DAGs loaded", slog.String("dags", strings.Join(dags, ",")))
	return nil
}

func (er *entryReaderImpl) loadDAG(ctx context.Context, filePath string) (*core.DAG, error) {
	return spec.Load(
		ctx,
		filepath.Clean(filePath),
		spec.OnlyMetadata(),
		spec.WithoutEval(),
		spec.SkipSchemaValidation(),
		spec.WithDAGsDir(er.targetDir),
	)
}

func (er *entryReaderImpl) registryKey(filePath string) string {
	rel, err := filepath.Rel(er.targetDir, filepath.Clean(filePath))
	if err != nil || strings.HasPrefix(rel, "..") || filepath.IsAbs(rel) {
		return filepath.Base(filePath)
	}
	return filepath.ToSlash(rel)
}

func (er *entryReaderImpl) addWatchDirs(root string) error {
	return filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !d.IsDir() {
			return nil
		}
		return er.watcher.Add(path)
	})
}
