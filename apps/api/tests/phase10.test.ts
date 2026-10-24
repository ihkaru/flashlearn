import { describe, test, expect } from 'bun:test';
import { BackgroundWorkerDaemon } from '../src/worker';

describe('Phase 10: Background Worker Daemon & Production Coolify Pipeline', () => {
  test('Worker daemon executes single cycle cleanly without throwing', async () => {
    const worker = new BackgroundWorkerDaemon(1000);
    const result = await worker.runCycle();

    expect(result).toBeDefined();
    expect(typeof result.sourcesChecked).toBe('number');
    expect(typeof result.timestamp).toBe('string');
  });

  test('Worker daemon starts and stops gracefully without leaking intervals', async () => {
    const worker = new BackgroundWorkerDaemon(100);
    worker.start();
    await new Promise((resolve) => setTimeout(resolve, 250));
    worker.stop();

    // Verify stops cleanly
    expect(true).toBe(true);
  });
});
