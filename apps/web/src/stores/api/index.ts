import { clearApiCache, API_URL, fetchWithAuth } from './core';
import { workspaceApi } from './workspaces';
import { contentApi } from './contents';
import { competencyApi } from './competencies';
import { taskApi } from './tasks';
import { gateApi } from './gates';
import { reviewerApi } from './reviewer';
import { spacedApi } from './spaced';
import { apiKeyApi } from './apiKeys';
import { auditApi } from './audit';
import { credentialApi } from './credentials';
import { diagnosticApi } from './diagnostic';
import { driftApi } from './drift';
import { consensusApi } from './consensus';
import { domainApi } from './domains';
import { socraticChatApi } from './socraticChat';

export { clearApiCache, API_URL, fetchWithAuth };

export const api = {
  workspaces: workspaceApi,
  domains: domainApi,
  contents: contentApi,
  competencies: competencyApi,
  tasks: taskApi,
  gates: gateApi,
  reviewer: reviewerApi,
  spaced: spacedApi,
  apiKeys: apiKeyApi,
  audit: auditApi,
  credentials: credentialApi,
  diagnostic: diagnosticApi,
  drift: driftApi,
  consensus: consensusApi,
  socraticChat: socraticChatApi,
};
