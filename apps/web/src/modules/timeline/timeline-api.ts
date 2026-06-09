import { apiRequest } from '../../lib/api';
import type { TimelineResponse } from './timeline.types';

export const getTimelinePageRequest = (
  token: string,
  cursor?: string,
  limit = 20,
) => {
  const params = new URLSearchParams({
    limit: String(limit),
  });

  if (cursor) {
    params.set('cursor', cursor);
  }

  return apiRequest<TimelineResponse>(`/timeline?${params.toString()}`, {
    token,
  });
};
