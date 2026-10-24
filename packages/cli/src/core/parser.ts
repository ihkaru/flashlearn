export interface ParsedArgs {
  noun?: string;
  action?: string;
  positionals: string[];
  flags: Record<string, any>;
}

export function parseCliArgs(argv: string[]): ParsedArgs {
  const flags: Record<string, any> = {};
  const positionals: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--') {
      positionals.push(...argv.slice(i + 1));
      break;
    }

    if (arg.startsWith('--')) {
      const equalIndex = arg.indexOf('=');
      if (equalIndex !== -1) {
        const key = arg.slice(2, equalIndex);
        const value = arg.slice(equalIndex + 1);
        flags[key] = value;
      } else {
        const key = arg.slice(2);
        const next = argv[i + 1];
        if (next && !next.startsWith('-')) {
          flags[key] = next;
          i++;
        } else {
          flags[key] = true;
        }
      }
    } else if (arg.startsWith('-') && arg.length > 1) {
      const key = arg.slice(1);
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positionals.push(arg);
    }
  }

  const noun = positionals[0];
  const action = positionals[1];
  const restPositionals = positionals.slice(2);

  return {
    noun,
    action,
    positionals: restPositionals,
    flags,
  };
}
