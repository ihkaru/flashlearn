export const SCHEMA_VERSION = '1.0.0';

export enum ExitCode {
  SUCCESS = 0,
  GENERAL_ERROR = 1,
  USAGE_ERROR = 2,
  VALIDATION_ERROR = 64, // EX_USAGE
  TRANSIENT_ERROR = 69,  // EX_UNAVAILABLE
  PERMISSION_DENIED = 77,// EX_NOPERM
  COMMAND_NOT_FOUND = 127,
}

export interface NextAction {
  command: string;
  description: string;
}

export interface SuccessEnvelope<T = any> {
  schemaVersion: string;
  status: 'success';
  command: string;
  data: T;
  nextActions?: NextAction[];
  meta?: {
    durationMs: number;
    timestamp: string;
    itemCount?: number;
    totalBeforeSlice?: number;
    appliedTransforms?: Record<string, any>;
  };
}

export interface ErrorDetails {
  code: string;
  message: string;
  retryable: boolean;
  suggestedFix?: string;
  details?: any;
}

export interface ErrorEnvelope {
  schemaVersion: string;
  status: 'error';
  command: string;
  error: ErrorDetails;
  meta?: {
    durationMs: number;
    timestamp: string;
  };
}

export class CliError extends Error {
  public readonly code: string;
  public readonly exitCode: ExitCode;
  public readonly retryable: boolean;
  public readonly suggestedFix?: string;
  public readonly details?: any;

  constructor(options: {
    code: string;
    message: string;
    exitCode?: ExitCode;
    retryable?: boolean;
    suggestedFix?: string;
    details?: any;
  }) {
    super(options.message);
    this.name = 'CliError';
    this.code = options.code;
    this.exitCode = options.exitCode ?? ExitCode.GENERAL_ERROR;
    this.retryable = options.retryable ?? false;
    this.suggestedFix = options.suggestedFix;
    this.details = options.details;
  }
}

/**
 * Filter object or array of objects to only include selected fields (Token Optimization)
 */
export function filterFields<T>(data: T, fields?: string[]): T {
  if (!fields || fields.length === 0 || !data) return data;

  const filterItem = (item: any): any => {
    if (typeof item !== 'object' || item === null) return item;
    const res: Record<string, any> = {};
    for (const f of fields) {
      if (f in item) {
        res[f] = item[f];
      }
    }
    return res;
  };

  if (Array.isArray(data)) {
    return data.map(filterItem) as unknown as T;
  }
  return filterItem(data);
}
