/**
 * Batch API Client
 * 
 * PHASE 2: Reduces network overhead by batching multiple API requests
 * into a single HTTP call.
 */

import { api } from './api';

export interface BatchRequest {
  id: string;
  endpoint: string;
  params?: Record<string, any>;
}

export interface BatchResponse<T = any> {
  id: string;
  status: number;
  data?: T;
  error?: string;
}

/**
 * Execute multiple API requests in a single batch call.
 * 
 * Example:
 * ```ts
 * const results = await batchRequest([
 *   { id: 'domains', endpoint: 'domains' },
 *   { id: 'tasks', endpoint: 'tasks', params: { limit: 50 } },
 *   { id: 'me', endpoint: 'me' }
 * ]);
 * 
 * const domains = results.find(r => r.id === 'domains')?.data;
 * const tasks = results.find(r => r.id === 'tasks')?.data;
 * ```
 */
export async function batchRequest(
  requests: BatchRequest[]
): Promise<BatchResponse[]> {
  const response = await api.post('/batch', { requests });
  return response.data;
}

/**
 * Type-safe batch request helper with result mapping.
 * 
 * Example:
 * ```ts
 * const { domains, tasks, me } = await batchRequestTyped({
 *   domains: { endpoint: 'domains' },
 *   tasks: { endpoint: 'tasks', params: { limit: 50 } },
 *   me: { endpoint: 'me' }
 * });
 * ```
 */
export async function batchRequestTyped<T extends Record<string, Omit<BatchRequest, 'id'>>>(
  requests: T
): Promise<{ [K in keyof T]: any }> {
  const requestArray: BatchRequest[] = Object.entries(requests).map(([id, req]) => ({
    id,
    ...req,
  } as BatchRequest));

  const responses = await batchRequest(requestArray);

  const result: any = {};
  for (const response of responses) {
    if (response.status === 200 && response.data) {
      result[response.id] = response.data;
    } else {
      console.error(`Batch request failed for ${response.id}:`, response.error);
      result[response.id] = null;
    }
  }

  return result;
}

/**
 * Hook for initial page load data fetching.
 * 
 * PHASE 2: Fetches domains, user profile, and permissions in a single request.
 */
export async function fetchInitialData() {
  return batchRequestTyped({
    domains: { endpoint: 'domains' },
    me: { endpoint: 'me' },
    permissions: { endpoint: 'permissions' },
  });
}

/**
 * Hook for dashboard initial load.
 * 
 * PHASE 2: Fetches domains, tasks, and projects in a single request.
 */
export async function fetchDashboardData(params?: {
  taskLimit?: number;
  projectLimit?: number;
}) {
  return batchRequestTyped({
    domains: { endpoint: 'domains' },
    tasks: { 
      endpoint: 'tasks', 
      params: { limit: params?.taskLimit || 50 } 
    },
    projects: { 
      endpoint: 'projects', 
      params: { limit: params?.projectLimit || 50 } 
    },
  });
}
