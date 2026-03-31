import { useInfiniteQuery } from "@tanstack/react-query";
import { getAuditLogs } from "../service/auditService";

export const useAuditLogsQuery = () =>
  useInfiniteQuery({
    queryKey: ["logs"],
    queryFn: ({ pageParam = 1 }) => getAuditLogs({ page: pageParam, limit: 25 }),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.pagination;
      if (!pagination) return undefined;
      return pagination.page < pagination.totalPages ? pagination.page + 1 : undefined;
    },
    staleTime: 1000 * 60,
  });
