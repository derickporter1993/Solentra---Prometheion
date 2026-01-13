import type { ApiClient } from '../client';
import type {
  OrgConnection,
  OrgHealthScore,
  CompatibilityAnalysis,
  AutomationScanResult,
  AuthMethod,
  OrgType,
} from '@platform/types';

export interface ConnectOrgParams {
  alias: string;
  orgType: OrgType;
  authMethod: AuthMethod;
  loginUrl?: string;
  // For JWT
  clientId?: string;
  username?: string;
  privateKey?: string;
  // For OAuth (code exchange happens server-side)
  authorizationCode?: string;
  redirectUri?: string;
}

export interface ListOrgsParams {
  page?: number;
  pageSize?: number;
  orgType?: OrgType;
}

export interface CompatibilityCheckParams {
  sourceOrgId: string;
  targetOrgId: string;
  sobjects?: string[];
}

export interface AutomationScanParams {
  orgId: string;
  sobjects: string[];
}

/**
 * Org management operations
 */
export class OrgsResource {
  constructor(private client: ApiClient) {}

  /**
   * Connect a new Salesforce org
   */
  async connect(params: ConnectOrgParams): Promise<OrgConnection> {
    return this.client.post<OrgConnection>('/orgs', params);
  }

  /**
   * Get OAuth authorization URL
   */
  async getAuthorizationUrl(params: {
    alias: string;
    loginUrl?: string;
    scopes?: string[];
  }): Promise<{ url: string; state: string }> {
    return this.client.post('/orgs/oauth/authorize', params);
  }

  /**
   * Complete OAuth flow with authorization code
   */
  async completeOAuth(params: {
    state: string;
    code: string;
  }): Promise<OrgConnection> {
    return this.client.post<OrgConnection>('/orgs/oauth/callback', params);
  }

  /**
   * List connected orgs
   */
  async list(params?: ListOrgsParams): Promise<{
    data: OrgConnection[];
    total: number;
  }> {
    return this.client.get('/orgs', params);
  }

  /**
   * Get a specific org
   */
  async get(orgId: string): Promise<OrgConnection> {
    return this.client.get<OrgConnection>(`/orgs/${orgId}`);
  }

  /**
   * Update org settings
   */
  async update(
    orgId: string,
    params: { alias?: string; orgType?: OrgType }
  ): Promise<OrgConnection> {
    return this.client.patch<OrgConnection>(`/orgs/${orgId}`, params);
  }

  /**
   * Disconnect an org
   */
  async disconnect(orgId: string): Promise<void> {
    return this.client.delete(`/orgs/${orgId}`);
  }

  /**
   * Get org health score
   */
  async getHealth(orgId: string): Promise<OrgHealthScore> {
    return this.client.get<OrgHealthScore>(`/orgs/${orgId}/health`);
  }

  /**
   * Refresh org health check
   */
  async refreshHealth(orgId: string): Promise<OrgHealthScore> {
    return this.client.post<OrgHealthScore>(`/orgs/${orgId}/health/refresh`);
  }

  /**
   * Get org schema (list of objects)
   */
  async getSchema(orgId: string): Promise<{
    sobjects: Array<{
      name: string;
      label: string;
      custom: boolean;
      queryable: boolean;
      createable: boolean;
    }>;
  }> {
    return this.client.get(`/orgs/${orgId}/schema`);
  }

  /**
   * Describe a specific object
   */
  async describeObject(
    orgId: string,
    sobject: string
  ): Promise<{
    name: string;
    label: string;
    fields: Array<{
      name: string;
      label: string;
      type: string;
      referenceTo?: string[];
      externalId: boolean;
      createable: boolean;
      updateable: boolean;
    }>;
    relationships: Array<{
      name: string;
      childSObject: string;
      field: string;
    }>;
  }> {
    return this.client.get(`/orgs/${orgId}/schema/${sobject}`);
  }

  /**
   * Run compatibility analysis between source and target
   */
  async analyzeCompatibility(
    params: CompatibilityCheckParams
  ): Promise<CompatibilityAnalysis> {
    return this.client.post<CompatibilityAnalysis>('/orgs/compatibility', params);
  }

  /**
   * Scan target org for automations that may trigger on sync
   */
  async scanAutomations(
    params: AutomationScanParams
  ): Promise<AutomationScanResult> {
    return this.client.post<AutomationScanResult>('/orgs/automation-scan', params);
  }

  /**
   * Get org limits
   */
  async getLimits(orgId: string): Promise<{
    dailyApiRequests: { used: number; max: number };
    dailyBulkApiBatches: { used: number; max: number };
    dataStorageMb: { used: number; max: number };
    fileStorageMb: { used: number; max: number };
  }> {
    return this.client.get(`/orgs/${orgId}/limits`);
  }

  /**
   * Test org connection
   */
  async testConnection(orgId: string): Promise<{
    success: boolean;
    latencyMs: number;
    error?: string;
  }> {
    return this.client.post(`/orgs/${orgId}/test`);
  }
}
