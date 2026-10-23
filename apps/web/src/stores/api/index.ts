import { clearApiCache, API_URL, fetchWithAuth } from './core';
import { workspaceApi } from './workspaces';
import { contentApi } from './contents';
import { competencyApi } from './competencies';
import { taskApi } from './tasks';
import { gateApi } from './gates';
import { reviewerApi } from './reviewer';
import { spacedApi } from './spaced';
import { apiKeyApi } from './apiKeys';

export { clearApiCache, API_URL, fetchWithAuth };

export const api = {
  workspaces: workspaceApi,
  contents: contentApi,
  competencies: competencyApi,
  tasks: taskApi,
  gates: gateApi,
  reviewer: reviewerApi,
  spaced: spacedApi,
  apiKeys: apiKeyApi,
};
