import type { ApiClient } from '../client';
import type {
  Job,
  JobStatus,
  JobProgress,
  JobSummary,
  JobArtifacts,
  JobProgressEvent,
  ApiUsageSummary,
} from '@platform/types';

export interface StartJobParams {
  planId: string;
  dryRun?: boolean;
  shadowMode?: boolean;
  enableSnapshot?: boolean;
  scheduledAt?: string; // ISO date for scheduled execution
}

export interface ListJobsParams {
  page?: number;
  pageSize?: number;
  status?: JobStatus | JobStatus[];
  planId?: string;
  sourceOrgId?: string;
  targetOrgId?: string;
  startDate?: string;
  endDate?: string;
}

export interface JobStreamCallbacks {
  onProgress?: (progress: JobProgress) => void;
  onLog?: (log: { level: string; message: string }) => void;
  onError?: (error: { code: string; message: string }) => void;
  onComplete?: (summary: JobSummary) => void;
  onConnectionError?: (error: Event) => void;
}

/**
 * Job execution and monitoring operations
 */
export class JobsResource {
  constructor(private client: ApiClient) {}

  /**
   * Start a new job from a plan
   */
  async start(params: StartJobParams): Promise<Job> {
    return this.client.post<Job>('/jobs', params);
  }

  /**
   * List jobs
   */
  async list(params?: ListJobsParams): Promise<{
    data: Job[];
    total: number;
  }> {
    // Convert array status to comma-separated string if needed
    const queryParams = params ? {
      ...params,
      status: Array.isArray(params.status) ? params.status.join(',') : params.status,
    } : undefined;

    return this.client.get('/jobs', queryParams);
  }

  /**
   * Get a specific job
   */
  async get(jobId: string): Promise<Job> {
    return this.client.get<Job>(`/jobs/${jobId}`);
  }

  /**
   * Cancel a running job
   */
  async cancel(jobId: string, reason?: string): Promise<Job> {
    return this.client.post<Job>(`/jobs/${jobId}/cancel`, { reason });
  }

  /**
   * Retry a failed job
   */
  async retry(jobId: string): Promise<Job> {
    return this.client.post<Job>(`/jobs/${jobId}/retry`);
  }

  /**
   * Get job progress
   */
  async getProgress(jobId: string): Promise<JobProgress | null> {
    const job = await this.get(jobId);
    return job.progress ?? null;
  }

  /**
   * Get job summary (available after completion)
   */
  async getSummary(jobId: string): Promise<JobSummary | null> {
    const job = await this.get(jobId);
    return job.summary ?? null;
  }

  /**
   * Get job artifacts (logs, reports, etc.)
   */
  async getArtifacts(jobId: string): Promise<JobArtifacts | null> {
    const job = await this.get(jobId);
    return job.artifacts ?? null;
  }

  /**
   * Download a specific artifact
   */
  async downloadArtifact(
    jobId: string,
    artifactType: keyof JobArtifacts
  ): Promise<Blob> {
    const response = await fetch(
      `${(this.client as any).config.baseUrl}/jobs/${jobId}/artifacts/${artifactType}`,
      {
        headers: {
          Authorization: `Bearer ${(this.client as any).config.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download artifact: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Subscribe to job progress stream (SSE)
   */
  subscribeToProgress(jobId: string, callbacks: JobStreamCallbacks): () => void {
    const eventSource = this.client.subscribeToStream(
      `/jobs/${jobId}/stream`,
      (event) => {
        try {
          const data: JobProgressEvent = JSON.parse(event.data);

          switch (data.type) {
            case 'progress':
              callbacks.onProgress?.(data.data as JobProgress);
              break;
            case 'log':
              callbacks.onLog?.(data.data as { level: string; message: string });
              break;
            case 'error':
              callbacks.onError?.(data.data as { code: string; message: string });
              break;
            case 'complete':
              callbacks.onComplete?.((data.data as { summary: JobSummary }).summary);
              eventSource.close();
              break;
          }
        } catch (error) {
          console.error('Failed to parse SSE event:', error);
        }
      },
      callbacks.onConnectionError
    );

    // Return unsubscribe function
    return () => eventSource.close();
  }

  /**
   * Wait for job completion (polling-based)
   */
  async waitForCompletion(
    jobId: string,
    options?: {
      pollIntervalMs?: number;
      timeoutMs?: number;
      onProgress?: (job: Job) => void;
    }
  ): Promise<Job> {
    const pollInterval = options?.pollIntervalMs ?? 2000;
    const timeout = options?.timeoutMs ?? 3600000; // 1 hour default
    const startTime = Date.now();

    while (true) {
      const job = await this.get(jobId);

      if (options?.onProgress) {
        options.onProgress(job);
      }

      if (
        job.status === 'completed' ||
        job.status === 'failed' ||
        job.status === 'cancelled'
      ) {
        return job;
      }

      if (Date.now() - startTime > timeout) {
        throw new Error(`Job ${jobId} timed out after ${timeout}ms`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  /**
   * Get API usage for a job
   */
  async getApiUsage(jobId: string): Promise<{
    calls: number;
    bulkBatches: number;
  }> {
    const job = await this.get(jobId);
    return job.apiUsage;
  }

  /**
   * Get API usage summary for workspace
   */
  async getUsageSummary(params?: {
    orgId?: string;
    period?: 'day' | 'week' | 'month';
  }): Promise<ApiUsageSummary> {
    return this.client.get<ApiUsageSummary>('/jobs/usage', params);
  }

  /**
   * Get recent jobs for dashboard
   */
  async getRecent(limit?: number): Promise<Job[]> {
    const result = await this.list({
      pageSize: limit ?? 10,
      page: 1,
    });
    return result.data;
  }

  /**
   * Get job statistics
   */
  async getStats(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    total: number;
    completed: number;
    failed: number;
    cancelled: number;
    averageDurationMs: number;
    totalRecordsProcessed: number;
    totalApiCalls: number;
  }> {
    return this.client.get('/jobs/stats', params);
  }

  /**
   * Rollback a completed job (if snapshot was enabled)
   */
  async rollback(jobId: string): Promise<Job> {
    return this.client.post<Job>(`/jobs/${jobId}/rollback`);
  }

  /**
   * Check if rollback is available
   */
  async canRollback(jobId: string): Promise<{
    available: boolean;
    reason?: string;
    expiresAt?: string;
  }> {
    return this.client.get(`/jobs/${jobId}/rollback/status`);
  }
}
