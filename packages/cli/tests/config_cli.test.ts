import { describe, expect, it, spyOn } from 'bun:test';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCli } from '../src/index';
import { ExitCode } from '../src/core/envelope';
import { resolveConfigWithSources } from '../src/core/config';

describe('CLI config & Base URL / API Key resolution', () => {
  it('sets, masks, reads, and unsets --base-url and --api-key via `config` command', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fl-cli-cfg-'));
    const cfgPath = join(dir, 'config.json');
    const prevEnv = {
      FLASHLEARN_BASE_URL: process.env.FLASHLEARN_BASE_URL,
      FLASHLEARN_API_URL: process.env.FLASHLEARN_API_URL,
      FLASHLEARN_API_KEY: process.env.FLASHLEARN_API_KEY,
      FLASHLEARN_SUPERADMIN_API_KEY: process.env.FLASHLEARN_SUPERADMIN_API_KEY,
      FL_API_URL: process.env.FL_API_URL,
      FL_API_KEY: process.env.FL_API_KEY,
      FL_BASE_URL: process.env.FL_BASE_URL,
    };

    try {
      delete process.env.FLASHLEARN_BASE_URL;
      delete process.env.FLASHLEARN_API_URL;
      delete process.env.FLASHLEARN_API_KEY;
      delete process.env.FLASHLEARN_SUPERADMIN_API_KEY;
      delete process.env.FL_API_URL;
      delete process.env.FL_API_KEY;
      delete process.env.FL_BASE_URL;

      let out = '';
      const spy = spyOn(process.stdout, 'write').mockImplementation((chunk: any) => {
        out += String(chunk);
        return true;
      });

      const sampleKey = 'fl_live_0123456789abcdef0123456789abcdef0123456789abcdef';
      const setCode = await runCli([
        'config',
        'set',
        '--config',
        cfgPath,
        '--base-url',
        'https://learn.dvlpid.my.id/',
        '--api-key',
        sampleKey,
      ]);
      expect(setCode).toBe(ExitCode.SUCCESS);
      const setJson = JSON.parse(out);
      expect(setJson.data.effective.baseUrl).toBe('https://learn.dvlpid.my.id');
      expect(setJson.data.effective.apiKey).toBe('fl_live_012345...');
      expect(setJson.data.effective.hasApiKey).toBe(true);

      const storedRaw = JSON.parse(readFileSync(cfgPath, 'utf-8'));
      expect(storedRaw.apiUrl).toBe('https://learn.dvlpid.my.id');
      expect(storedRaw.apiKey).toBe(sampleKey);

      out = '';
      const getCode = await runCli(['config', 'get', '--config', cfgPath]);
      expect(getCode).toBe(ExitCode.SUCCESS);
      const getJson = JSON.parse(out);
      expect(getJson.data.sources.apiUrl).toBe('stored');
      expect(getJson.data.sources.apiKey).toBe('stored');
      expect(getJson.data.effective.apiKey).toBe('fl_live_012345...');

      out = '';
      const unsetCode = await runCli(['config', 'unset', '--config', cfgPath, '--api-key']);
      expect(unsetCode).toBe(ExitCode.SUCCESS);
      const unsetJson = JSON.parse(out);
      expect(unsetJson.data.effective.hasApiKey).toBe(false);
      expect(unsetJson.data.effective.baseUrl).toBe('https://learn.dvlpid.my.id');

      spy.mockRestore();
    } finally {
      for (const [k, v] of Object.entries(prevEnv)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('resolves Infisical env vars (FLASHLEARN_BASE_URL & FLASHLEARN_SUPERADMIN_API_KEY) with strict flag precedence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fl-cli-env-'));
    const cfgPath = join(dir, 'config.json');
    const prev = {
      FLASHLEARN_BASE_URL: process.env.FLASHLEARN_BASE_URL,
      FLASHLEARN_API_KEY: process.env.FLASHLEARN_API_KEY,
      FLASHLEARN_SUPERADMIN_API_KEY: process.env.FLASHLEARN_SUPERADMIN_API_KEY,
    };

    try {
      process.env.FLASHLEARN_BASE_URL = 'https://learn.dvlpid.my.id/';
      delete process.env.FLASHLEARN_API_KEY;
      process.env.FLASHLEARN_SUPERADMIN_API_KEY = 'fl_live_superadmin_secret_123456';

      const fromEnv = resolveConfigWithSources({ config: cfgPath });
      expect(fromEnv.config.apiUrl).toBe('https://learn.dvlpid.my.id');
      expect(fromEnv.config.apiKey).toBe('fl_live_superadmin_secret_123456');
      expect(fromEnv.sources.apiUrl).toBe('env');
      expect(fromEnv.sources.apiKey).toBe('env');

      const fromFlag = resolveConfigWithSources({
        config: cfgPath,
        'base-url': 'https://staging.example.com/',
        'api-key': 'fl_live_override_999999',
      });
      expect(fromFlag.config.apiUrl).toBe('https://staging.example.com');
      expect(fromFlag.config.apiKey).toBe('fl_live_override_999999');
      expect(fromFlag.sources.apiUrl).toBe('flag');
      expect(fromFlag.sources.apiKey).toBe('flag');
    } finally {
      for (const [k, v] of Object.entries(prev)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
