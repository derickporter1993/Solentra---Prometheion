/**
 * @platform/sf-client
 *
 * Salesforce API client library for REST, Bulk 2.0, and Tooling APIs
 */

// Authentication
export {
  authenticateWithJwt,
  validateJwtConfig,
  AuthenticationError,
} from './auth/jwt';
export type { JwtAuthConfig, TokenResponse } from './auth/jwt';

export {
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  revokeToken,
  getUserIdentity,
  OAuthError,
} from './auth/oauth';
export type {
  OAuthConfig,
  OAuthTokenResponse,
  RefreshTokenResponse,
  UserIdentity,
} from './auth/oauth';

// REST API
export { RestClient, RestApiError } from './rest/client';
export type {
  RestClientConfig,
  QueryResult,
  DescribeResult,
  FieldDescribe,
  PicklistValue,
  ChildRelationship,
} from './rest/client';

// Bulk API 2.0
export { BulkClient, BulkApiError } from './bulk/client';
export type {
  BulkClientConfig,
  BulkOperation,
  JobState,
  BulkJobInfo,
  BulkQueryJobInfo,
  IngestJobResult,
} from './bulk/client';

// Tooling API
export { ToolingClient, ToolingApiError } from './tooling/client';
export type {
  ToolingClientConfig,
  FlowDefinition,
  ApexTrigger,
  WorkflowRule,
  ValidationRule,
  RecordType,
} from './tooling/client';

/**
 * Create a unified Salesforce client with all APIs
 */
export interface SalesforceClientConfig {
  instanceUrl: string;
  accessToken: string;
  apiVersion?: string;
}

export class SalesforceClient {
  public readonly rest: import('./rest/client').RestClient;
  public readonly bulk: import('./bulk/client').BulkClient;
  public readonly tooling: import('./tooling/client').ToolingClient;

  private config: SalesforceClientConfig;

  constructor(config: SalesforceClientConfig) {
    this.config = config;

    // Dynamically import to avoid circular dependencies
    const { RestClient } = require('./rest/client');
    const { BulkClient } = require('./bulk/client');
    const { ToolingClient } = require('./tooling/client');

    this.rest = new RestClient(config);
    this.bulk = new BulkClient(config);
    this.tooling = new ToolingClient(config);
  }

  /**
   * Update access token across all clients
   */
  setAccessToken(accessToken: string): void {
    this.config.accessToken = accessToken;
    this.rest.setAccessToken(accessToken);
    this.bulk.setAccessToken(accessToken);
    this.tooling.setAccessToken(accessToken);
  }

  /**
   * Get current configuration
   */
  getConfig(): SalesforceClientConfig {
    return { ...this.config };
  }
}

/**
 * Create a Salesforce client from JWT authentication
 */
export async function createClientFromJwt(
  config: import('./auth/jwt').JwtAuthConfig
): Promise<SalesforceClient> {
  const { authenticateWithJwt } = require('./auth/jwt');
  const tokenResponse = await authenticateWithJwt(config);

  return new SalesforceClient({
    instanceUrl: tokenResponse.instanceUrl,
    accessToken: tokenResponse.accessToken,
  });
}

/**
 * Create a Salesforce client from OAuth tokens
 */
export function createClientFromOAuth(
  tokenResponse: import('./auth/oauth').OAuthTokenResponse
): SalesforceClient {
  return new SalesforceClient({
    instanceUrl: tokenResponse.instanceUrl,
    accessToken: tokenResponse.accessToken,
  });
}
