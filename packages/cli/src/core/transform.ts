export interface TransformOptions {
  fields?: string[];
  limit?: number;
  tail?: number; // alias: last
  offset?: number;
  filter?: string;
}

export interface TransformResult<T = any> {
  data: T;
  itemCount?: number;
  totalBeforeSlice?: number;
  appliedTransforms?: Record<string, any>;
}

/**
 * Universally filters, slices, tails, and masks fields for CLI outputs to minimize LLM token consumption.
 */
export function transformData<T = any>(raw: T, options: TransformOptions): TransformResult<T> {
  const applied: Record<string, any> = {};

  if (!raw || typeof raw !== 'object') {
    return { data: raw };
  }

  // Determine if raw is an array or wraps an array
  let targetArray: any[] | null = null;
  let wrapperKey: string | null = null;

  if (Array.isArray(raw)) {
    targetArray = raw;
  } else {
    // Check known container keys
    const candidateKeys = ['records', 'chunks', 'data', 'items', 'nodes', 'edges', 'gates', 'tasks', 'contents'];
    for (const key of candidateKeys) {
      if (Array.isArray((raw as any)[key])) {
        targetArray = (raw as any)[key];
        wrapperKey = key;
        break;
      }
    }
  }

  // If no array found, apply single-object field projection
  if (!targetArray) {
    if (options.fields && options.fields.length > 0) {
      applied.fields = options.fields;
      const filtered = projectFields(raw, options.fields);
      return { data: filtered as T, appliedTransforms: applied };
    }
    return { data: raw };
  }

  let processed = [...targetArray];
  const totalOriginal = targetArray.length;

  // 1. Filter phase
  if (options.filter && options.filter.trim().length > 0) {
    applied.filter = options.filter;
    const filterStr = options.filter.trim();

    if (filterStr.includes('=')) {
      // Key-value filtering, e.g. "role=creator" or "status=mastered,riskLevel=low"
      const pairs = filterStr.split(',').map((p) => p.split('=').map((s) => s.trim()));
      processed = processed.filter((item) => {
        if (!item || typeof item !== 'object') return false;
        return pairs.every(([k, v]) => {
          if (!k || v === undefined) return true;
          const itemVal = item[k];
          return String(itemVal).toLowerCase() === v.toLowerCase();
        });
      });
    } else {
      // Substring fuzzy filter across JSON
      const query = filterStr.toLowerCase();
      processed = processed.filter((item) => JSON.stringify(item).toLowerCase().includes(query));
    }
  }

  const totalBeforeSlice = processed.length;

  // 2. Tail / Last (Limit from last line) vs. Offset / Limit
  if (options.tail !== undefined && options.tail > 0) {
    applied.tail = options.tail;
    processed = processed.slice(-options.tail);
  } else {
    if (options.offset !== undefined && options.offset > 0) {
      applied.offset = options.offset;
      processed = processed.slice(options.offset);
    }
    if (options.limit !== undefined && options.limit > 0) {
      applied.limit = options.limit;
      processed = processed.slice(0, options.limit);
    }
  }

  // 3. Field Masking
  if (options.fields && options.fields.length > 0) {
    applied.fields = options.fields;
    processed = processed.map((item) => projectFields(item, options.fields!));
  }

  // Re-wrap or return
  let finalData: any;
  if (wrapperKey) {
    finalData = { ...(raw as any), [wrapperKey]: processed };
  } else {
    finalData = processed;
  }

  return {
    data: finalData as T,
    itemCount: processed.length,
    totalBeforeSlice,
    appliedTransforms: Object.keys(applied).length > 0 ? applied : undefined,
  };
}

function projectFields(item: any, fields: string[]): any {
  if (typeof item !== 'object' || item === null) return item;
  const res: Record<string, any> = {};
  for (const f of fields) {
    if (f in item) {
      res[f] = item[f];
    }
  }
  return res;
}
