#!/usr/bin/env bun
import { runCli } from '../src/index';

runCli(process.argv.slice(2)).then((code) => {
  if (code !== 0) {
    process.exit(code);
  }
});
