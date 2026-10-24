import type { ResourceSchemaDef } from './schemas/types';
import { COMPETENCY_SCHEMAS } from './schemas/competency-schemas';
import { SUPPORT_SCHEMAS } from './schemas/support-schemas';

export * from './schemas/types';

export const SCHEMA_REGISTRY: Record<string, ResourceSchemaDef> = {
  ...COMPETENCY_SCHEMAS,
  ...SUPPORT_SCHEMAS,
};
