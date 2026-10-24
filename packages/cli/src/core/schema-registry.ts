import type { ResourceSchemaDef } from './schemas/types';
import { DOMAIN_SCHEMAS } from './schemas/domain-schemas';
import { COMPETENCY_SCHEMAS } from './schemas/competency-schemas';
import { TASK_SCHEMAS } from './schemas/task-schemas';
import { SUPPORT_SCHEMAS } from './schemas/support-schemas';

export * from './schemas/types';

export const SCHEMA_REGISTRY: Record<string, ResourceSchemaDef> = {
  ...DOMAIN_SCHEMAS,
  ...COMPETENCY_SCHEMAS,
  ...TASK_SCHEMAS,
  ...SUPPORT_SCHEMAS,
};
