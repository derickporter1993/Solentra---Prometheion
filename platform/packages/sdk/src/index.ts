/**
 * @platform/sdk
 *
 * Typed SDK for interacting with the Salesforce DevOps Platform API
 */

import { ApiClient, ClientConfig, PlatformApiError } from './client';
import { OrgsResource } from './resources/orgs';
import { SyncResource } from './resources/sync';
import { JobsResource } from './resources/jobs';
import { PoliciesResource } from './resources/policies';

export { ApiClient, PlatformApiError } from './client';
export type { ClientConfig, RequestOptions, PaginatedResponse, ApiError } from './client';

export { OrgsResource } from './resources/orgs';
export type { ConnectOrgParams, ListOrgsParams, CompatibilityCheckParams, AutomationScanParams } from './resources/orgs';

export { SyncResource } from './resources/sync';
export type { CreatePlanParams, UpdatePlanParams, ListPlansParams, ListTemplatesParams, NativeRefreshInput } from './resources/sync';

export { JobsResource } from './resources/jobs';
export type { StartJobParams, ListJobsParams, JobStreamCallbacks } from './resources/jobs';

export { PoliciesResource } from './resources/policies';
export type { CreatePolicyParams, UpdatePolicyParams, ListPoliciesParams, PreviewMaskingParams } from './resources/policies';

/**
 * Main Platform SDK client
 *
 * @example
 * ```typescript
 * import { PlatformClient } from '@platform/sdk';
 *
 * const client = new PlatformClient({
 *   baseUrl: 'https://api.platform.example.com',
 *   accessToken: 'your-token',
 *   workspaceId: 'ws-123',
 * });
 *
 * // Connect an org
 * const org = await client.orgs.connect({
 *   alias: 'production',
 *   orgType: 'production',
 *   authMethod: 'jwt_bearer',
 *   clientId: '...',
 *   username: '...',
 *   privateKey: '...',
 * });
 *
 * // Create a sync plan
 * const plan = await client.sync.createPlan({
 *   mode: 'prod_subset_masked',
 *   sourceOrgId: org.id,
 *   targetOrgId: 'target-org-id',
 *   objects: [...],
 *   options: { conflictStrategy: 'source_wins' },
 * });
 *
 * // Start a job
 * const job = await client.jobs.start({ planId: plan.id });
 *
 * // Subscribe to progress
 * client.jobs.subscribeToProgress(job.id, {
 *   onProgress: (progress) => console.log(progress),
 *   onComplete: (summary) => console.log('Done!', summary),
 * });
 * ```
 */
export class PlatformClient {
  private apiClient: ApiClient;

  public readonly orgs: OrgsResource;
  public readonly sync: SyncResource;
  public readonly jobs: JobsResource;
  public readonly policies: PoliciesResource;

  constructor(config: ClientConfig) {
    this.apiClient = new ApiClient(config);

    this.orgs = new OrgsResource(this.apiClient);
    this.sync = new SyncResource(this.apiClient);
    this.jobs = new JobsResource(this.apiClient);
    this.policies = new PoliciesResource(this.apiClient);
  }

  /**
   * Set the workspace context for all requests
   */
  setWorkspace(workspaceId: string): void {
    this.apiClient.setWorkspace(workspaceId);
  }

  /**
   * Set the access token for authentication
   */
  setAccessToken(token: string): void {
    this.apiClient.setAccessToken(token);
  }

  /**
   * Update client configuration
   */
  configure(config: Partial<ClientConfig>): void {
    this.apiClient.setConfig(config);
  }

  /**
   * Get the underlying API client for custom requests
   */
  getApiClient(): ApiClient {
    return this.apiClient;
  }
}

/**
 * Create a new Platform SDK client
 */
export function createClient(config: ClientConfig): PlatformClient {
  return new PlatformClient(config);
}

/**
 * Default export
 */
export default PlatformClient;
