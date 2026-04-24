/**
 * Infinite Scroll Hook
 * 
 * PHASE 4: Implements infinite scroll pagination using @tanstack/react-virtual
 * for efficient rendering of large task lists.
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Task } from '@/types';

interface UseInfiniteScrollOptions {
  endpoint: string;
  queryKey: string[];
  filters?: Record<string, any>;
  pageSize?: number;
  enabled?: boolean;
}

export function useInfiniteScroll({
  endpoint,
  queryKey,
  filters = {},
  pageSize = 50,
  enabled = true,
}: UseInfiniteScrollOptions) {
  return useInfiniteQuery<Task[], Error>({
    queryKey: [...queryKey, filters],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      const params = new URLSearchParams({
        ...filters,
        limit: pageSize.toString(),
        offset: (page * pageSize).toString(),
      });
      
      const response = await api.get(`${endpoint}?${params}`);
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      // If last page has fewer items than pageSize, we've reached the end
      if (lastPage.length < pageSize) {
        return undefined;
      }
      return allPages.length;
    },
    initialPageParam: 0,
    enabled,
  });
}
