import { container } from './infrastructure/di/container';

export class BackgroundWorkerDaemon {
  private isRunning = false;
  private intervalTimer: NodeJS.Timeout | null = null;

  constructor(private readonly pollIntervalMs: number = 60000) {}

  async runCycle(): Promise<{ sourcesChecked: number; dueCardsCount: number; timestamp: string }> {
    const timestamp = new Date().toISOString();
    let sourcesChecked = 0;
    let dueCardsCount = 0;

    try {
      // 1. Check all workspaces
      const workspaces = await container.workspaceRepository.listAll();

      for (const ws of workspaces) {
        // Count active sources
        const sources = await container.sourceRepository.listByWorkspace(ws.id);
        sourcesChecked += sources.length;
      }

      console.log(`[Worker Daemon] [${timestamp}] Cycle complete. Workspaces checked: ${workspaces.length}, Sources monitored: ${sourcesChecked}`);

      return {
        sourcesChecked,
        dueCardsCount,
        timestamp,
      };
    } catch (err: any) {
      console.error(`[Worker Daemon Error] Cycle execution failed:`, err.message);
      throw err;
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`⚡ FlashLearn Background Worker Daemon started (Polling interval: ${this.pollIntervalMs}ms)`);

    // Run first cycle immediately
    this.runCycle().catch((err) => console.error('[Worker Daemon] Initial run failed:', err));

    this.intervalTimer = setInterval(() => {
      this.runCycle().catch((err) => console.error('[Worker Daemon] Periodic run failed:', err));
    }, this.pollIntervalMs);
  }

  stop() {
    this.isRunning = false;
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    console.log('🛑 FlashLearn Background Worker Daemon stopped cleanly.');
  }
}

// Standalone entrypoint
if (import.meta.main) {
  const isOnce = process.argv.includes('--once');
  const worker = new BackgroundWorkerDaemon(
    Number(process.env.WORKER_INTERVAL_MS) || 60000
  );

  if (isOnce) {
    console.log('⚡ Running single worker cycle (--once mode)...');
    worker
      .runCycle()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  } else {
    worker.start();

    const shutdown = () => {
      worker.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}
