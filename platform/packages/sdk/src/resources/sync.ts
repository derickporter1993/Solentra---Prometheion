import type { ApiClient } from '../client';
import type {
  SyncPlan,
  SyncMode,
  SyncEstimate,
  DependencyGraph,
  ObjectConfig,
  SyncOptions,
  NativeRefreshComparison,
  DriftCheckResult,
  SyncTemplate,
  TemplateCategory,
} from '@platform/types';

export interface CreatePlanParams {
  name?: string;
  mode: SyncMode;
  sourceOrgId: string;
  targetOrgId: string;
  policyId?: string;
  objects: ObjectConfig[];
  options: Partial<SyncOptions>;
}

export interface UpdatePlanParams {
  name?: string;
  objects?: ObjectConfig[];
  options?: Partial<SyncOptions>;
  policyId?: string;
}

export interface ListPlansParams {
  page?: number;
  pageSize?: number;
  mode?: SyncMode;
  sourceOrgId?: string;
  targetOrgId?: string;
}

export interface ListTemplatesParams {
  category?: TemplateCategory;
  search?: string;
  curated?: boolean;
}

export interface NativeRefreshInput {
  estimatedDurationMinutes?: number;
  recordsCopied?: number;
  lastRefreshDate?: string;
}

/**
 * Sync planning and execution operations
 */
export class SyncResource {
  constructor(private client: ApiClient) {}

  // ==========================================================================
  // PLANS
  // ==========================================================================

  /**
   * Create a new sync plan
   */
  async createPlan(params: CreatePlanParams): Promise<SyncPlan> {
    return this.client.post<SyncPlan>('/sync/plans', params);
  }

  /**
   * List sync plans
   */
  async listPlans(params?: ListPlansParams): Promise<{
    data: SyncPlan[];
    total: number;
  }> {
    return this.client.get('/sync/plans', params);
  }

  /**
   * Get a specific plan
   */
  async getPlan(planId: string): Promise<SyncPlan> {
    return this.client.get<SyncPlan>(`/sync/plans/${planId}`);
  }

  /**
   * Update a plan
   */
  async updatePlan(planId: string, params: UpdatePlanParams): Promise<SyncPlan> {
    return this.client.patch<SyncPlan>(`/sync/plans/${planId}`, params);
  }

  /**
   * Delete a plan
   */
  async deletePlan(planId: string): Promise<void> {
    return this.client.delete(`/sync/plans/${planId}`);
  }

  /**
   * Validate a plan
   */
  async validatePlan(planId: string): Promise<{
    valid: boolean;
    errors: Array<{ field: string; message: string }>;
    warnings: Array<{ field: string; message: string }>;
  }> {
    return this.client.post(`/sync/plans/${planId}/validate`);
  }

  /**
   * Get plan estimates (record counts, API usage, duration)
   */
  async getEstimates(planId: string): Promise<SyncEstimate> {
    return this.client.get<SyncEstimate>(`/sync/plans/${planId}/estimates`);
  }

  /**
   * Get dependency graph for plan
   */
  async getDependencyGraph(planId: string): Promise<DependencyGraph> {
    return this.client.get<DependencyGraph>(`/sync/plans/${planId}/graph`);
  }

  /**
   * Export plan as JSON (for GitOps-lite)
   */
  async exportPlan(planId: string): Promise<{
    plan: SyncPlan;
    exportedAt: string;
    version: string;
  }> {
    return this.client.get(`/sync/plans/${planId}/export`);
  }

  /**
   * Import a plan from JSON
   */
  async importPlan(planJson: unknown): Promise<SyncPlan> {
    return this.client.post<SyncPlan>('/sync/plans/import', { plan: planJson });
  }

  // ==========================================================================
  // TEMPLATES
  // ==========================================================================

  /**
   * List available sync templates
   */
  async listTemplates(params?: ListTemplatesParams): Promise<{
    data: SyncTemplate[];
    total: number;
  }> {
    return this.client.get('/sync/templates', params);
  }

  /**
   * Get a specific template
   */
  async getTemplate(templateId: string): Promise<SyncTemplate> {
    return this.client.get<SyncTemplate>(`/sync/templates/${templateId}`);
  }

  /**
   * Create a plan from a template
   */
  async createPlanFromTemplate(
    templateId: string,
    params: {
      sourceOrgId: string;
      targetOrgId: string;
      name?: string;
      overrides?: Partial<CreatePlanParams>;
    }
  ): Promise<SyncPlan> {
    return this.client.post<SyncPlan>(`/sync/templates/${templateId}/apply`, params);
  }

  /**
   * Save current plan as a template
   */
  async savePlanAsTemplate(
    planId: string,
    params: {
      name: string;
      description?: string;
      category: TemplateCategory;
      isPublic?: boolean;
    }
  ): Promise<SyncTemplate> {
    return this.client.post<SyncTemplate>(`/sync/plans/${planId}/save-as-template`, params);
  }

  // ==========================================================================
  // COMPARISONS & ANALYSIS
  // ==========================================================================

  /**
   * Compare to native sandbox refresh
   */
  async compareToNativeRefresh(
    planId: string,
    nativeRefreshInput?: NativeRefreshInput
  ): Promise<NativeRefreshComparison> {
    return this.client.post<NativeRefreshComparison>(
      `/sync/plans/${planId}/compare-native`,
      nativeRefreshInput
    );
  }

  /**
   * Run drift check between source and target
   */
  async checkDrift(params: {
    sourceOrgId: string;
    targetOrgId: string;
    categories?: Array<'profile' | 'permission_set' | 'custom_setting' | 'org_setting'>;
  }): Promise<DriftCheckResult> {
    return this.client.post<DriftCheckResult>('/sync/drift-check', params);
  }

  /**
   * Get suggested objects based on mode and org type
   */
  async getSuggestedObjects(params: {
    sourceOrgId: string;
    mode: SyncMode;
  }): Promise<{
    suggested: Array<{
      sobject: string;
      reason: string;
      recordCount: number;
      hasPii: boolean;
    }>;
    dependencies: Record<string, string[]>;
  }> {
    return this.client.post('/sync/suggest-objects', params);
  }

  // ==========================================================================
  // QUICK ACTIONS
  // ==========================================================================

  /**
   * Create and immediately execute a sync (convenience method)
   */
  async quickSync(params: CreatePlanParams & { dryRun?: boolean }): Promise<{
    plan: SyncPlan;
    jobId: string;
  }> {
    return this.client.post('/sync/quick', params);
  }

  /**
   * Preview what a sync would do without creating a plan
   */
  async preview(
    params: Omit<CreatePlanParams, 'name'>
  ): Promise<{
    estimates: SyncEstimate;
    graph: DependencyGraph;
    compatibilityIssues: Array<{ severity: string; message: string }>;
  }> {
    return this.client.post('/sync/preview', params);
  }
}
