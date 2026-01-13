import type { ApiClient } from '../client';
import type {
  MaskingPolicy,
  MaskingPolicyVersion,
  MaskingRule,
  MaskingPreview,
  MaskingEffectivenessScore,
} from '@platform/types';

export interface CreatePolicyParams {
  name: string;
  description?: string;
  rules: MaskingRule[];
  isDefault?: boolean;
}

export interface UpdatePolicyParams {
  name?: string;
  description?: string;
  rules?: MaskingRule[];
  isDefault?: boolean;
  changeNote?: string;
}

export interface ListPoliciesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isDefault?: boolean;
}

export interface PreviewMaskingParams {
  policyId: string;
  orgId: string;
  sobjects: string[];
  sampleSize?: number;
  showOriginal?: boolean; // Requires admin permission
}

/**
 * Masking policy management operations
 */
export class PoliciesResource {
  constructor(private client: ApiClient) {}

  // ==========================================================================
  // CRUD OPERATIONS
  // ==========================================================================

  /**
   * Create a new masking policy
   */
  async create(params: CreatePolicyParams): Promise<MaskingPolicy> {
    return this.client.post<MaskingPolicy>('/policies', params);
  }

  /**
   * List masking policies
   */
  async list(params?: ListPoliciesParams): Promise<{
    data: MaskingPolicy[];
    total: number;
  }> {
    return this.client.get('/policies', params);
  }

  /**
   * Get a specific policy
   */
  async get(policyId: string): Promise<MaskingPolicy> {
    return this.client.get<MaskingPolicy>(`/policies/${policyId}`);
  }

  /**
   * Update a policy (creates a new version)
   */
  async update(policyId: string, params: UpdatePolicyParams): Promise<MaskingPolicy> {
    return this.client.patch<MaskingPolicy>(`/policies/${policyId}`, params);
  }

  /**
   * Delete a policy
   */
  async delete(policyId: string): Promise<void> {
    return this.client.delete(`/policies/${policyId}`);
  }

  /**
   * Duplicate a policy
   */
  async duplicate(policyId: string, newName: string): Promise<MaskingPolicy> {
    return this.client.post<MaskingPolicy>(`/policies/${policyId}/duplicate`, {
      name: newName,
    });
  }

  // ==========================================================================
  // VERSIONING
  // ==========================================================================

  /**
   * List policy versions
   */
  async listVersions(policyId: string): Promise<{
    data: MaskingPolicyVersion[];
    total: number;
  }> {
    return this.client.get(`/policies/${policyId}/versions`);
  }

  /**
   * Get a specific version
   */
  async getVersion(policyId: string, version: number): Promise<MaskingPolicyVersion> {
    return this.client.get<MaskingPolicyVersion>(
      `/policies/${policyId}/versions/${version}`
    );
  }

  /**
   * Rollback to a previous version
   */
  async rollbackToVersion(
    policyId: string,
    version: number
  ): Promise<MaskingPolicy> {
    return this.client.post<MaskingPolicy>(
      `/policies/${policyId}/versions/${version}/rollback`
    );
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    policyId: string,
    version1: number,
    version2: number
  ): Promise<{
    added: MaskingRule[];
    removed: MaskingRule[];
    modified: Array<{
      ruleId: string;
      before: MaskingRule;
      after: MaskingRule;
    }>;
  }> {
    return this.client.get(
      `/policies/${policyId}/versions/compare?v1=${version1}&v2=${version2}`
    );
  }

  // ==========================================================================
  // PREVIEW & EFFECTIVENESS
  // ==========================================================================

  /**
   * Preview masking on sample data
   */
  async preview(params: PreviewMaskingParams): Promise<{
    previews: MaskingPreview[];
  }> {
    return this.client.post('/policies/preview', params);
  }

  /**
   * Calculate effectiveness score
   */
  async getEffectivenessScore(
    policyId: string,
    orgId: string
  ): Promise<MaskingEffectivenessScore> {
    return this.client.get<MaskingEffectivenessScore>(
      `/policies/${policyId}/effectiveness?orgId=${orgId}`
    );
  }

  /**
   * Get PII field suggestions based on org schema
   */
  async suggestRules(orgId: string): Promise<{
    suggestions: Array<{
      sobject: string;
      field: string;
      fieldType: string;
      confidence: number;
      suggestedStrategy: MaskingRule['strategy'];
      reason: string;
    }>;
  }> {
    return this.client.get(`/policies/suggest?orgId=${orgId}`);
  }

  /**
   * Apply suggestions to create/update a policy
   */
  async applySuggestions(
    policyId: string | null,
    suggestions: Array<{
      sobject: string;
      field: string;
      strategy: MaskingRule['strategy'];
    }>
  ): Promise<MaskingPolicy> {
    return this.client.post('/policies/apply-suggestions', {
      policyId,
      suggestions,
    });
  }

  // ==========================================================================
  // TEMPLATES
  // ==========================================================================

  /**
   * List built-in policy templates
   */
  async listTemplates(): Promise<{
    templates: Array<{
      id: string;
      name: string;
      description: string;
      category: 'pii' | 'pci' | 'hipaa' | 'general';
      ruleCount: number;
    }>;
  }> {
    return this.client.get('/policies/templates');
  }

  /**
   * Create a policy from a template
   */
  async createFromTemplate(
    templateId: string,
    name: string
  ): Promise<MaskingPolicy> {
    return this.client.post<MaskingPolicy>('/policies/from-template', {
      templateId,
      name,
    });
  }

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  /**
   * Validate policy rules
   */
  async validate(rules: MaskingRule[]): Promise<{
    valid: boolean;
    errors: Array<{
      ruleId: string;
      field: string;
      message: string;
    }>;
  }> {
    return this.client.post('/policies/validate', { rules });
  }

  /**
   * Test a specific rule against sample data
   */
  async testRule(
    rule: MaskingRule,
    testData: Array<{ field: string; value: string }>
  ): Promise<{
    results: Array<{
      field: string;
      original: string;
      masked: string;
      matched: boolean;
    }>;
  }> {
    return this.client.post('/policies/test-rule', { rule, testData });
  }

  // ==========================================================================
  // EXPORT/IMPORT
  // ==========================================================================

  /**
   * Export policy as JSON
   */
  async export(policyId: string): Promise<{
    policy: MaskingPolicy;
    versions: MaskingPolicyVersion[];
    exportedAt: string;
  }> {
    return this.client.get(`/policies/${policyId}/export`);
  }

  /**
   * Import policy from JSON
   */
  async import(
    policyJson: unknown,
    options?: { preserveVersions?: boolean }
  ): Promise<MaskingPolicy> {
    return this.client.post<MaskingPolicy>('/policies/import', {
      policy: policyJson,
      ...options,
    });
  }
}
