import { apiRequest } from '../../lib/api';
import type { SearchUsersResponse } from './search.types';

export const searchUsersRequest = (
  token: string,
  query: string,
  limit = 10,
) => {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });

  return apiRequest<SearchUsersResponse>(`/users/search?${params.toString()}`, {
    token,
  });
};
