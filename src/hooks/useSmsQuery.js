import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getClassGroups,
  getSmsBatchById,
  getSmsBatchLogs,
  getSmsBatches,
  previewSmsRecipients,
  retrySmsFailed,
  sendSms,
} from "../service/smsService";

export const useClassGroupsQuery = (locationId) =>
  useQuery({
    queryKey: ["sms-class-groups", locationId],
    queryFn: () => getClassGroups(locationId),
    staleTime: 60_000,
  });

export const useSmsPreviewQuery = (payload, { enabled = true } = {}) =>
  useQuery({
    queryKey: ["sms-preview", payload],
    queryFn: () => previewSmsRecipients(payload),
    enabled: enabled && !!payload?.mode,
    staleTime: 5_000,
  });

export const useSendSmsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendSms,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sms-batches"] });
    },
  });
};

export const useSmsBatchesQuery = ({ page, limit }) =>
  useQuery({
    queryKey: ["sms-batches", page, limit],
    queryFn: () => getSmsBatches({ page, limit }),
    placeholderData: (prev) => prev,
    refetchInterval: (query) => {
      const hasProcessing = query.state.data?.data?.some((batch) => batch.status === "processing");
      return hasProcessing ? 4000 : false;
    },
  });

export const useSmsBatchDetailQuery = (batchId, { enabled = true } = {}) =>
  useQuery({
    queryKey: ["sms-batch", batchId],
    queryFn: () => getSmsBatchById(batchId),
    enabled: !!batchId && enabled,
    refetchInterval: (query) => (query.state.data?.data?.status === "processing" ? 3000 : false),
  });

export const useSmsBatchLogsQuery = (batchId, { page = 1, limit = 20, status, enabled = true } = {}) =>
  useQuery({
    queryKey: ["sms-batch-logs", batchId, page, limit, status],
    queryFn: () => getSmsBatchLogs(batchId, { page, limit, status }),
    enabled: !!batchId && enabled,
    placeholderData: (prev) => prev,
  });

export const useRetrySmsFailedMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: retrySmsFailed,
    onSuccess: (_data, batchId) => {
      queryClient.invalidateQueries({ queryKey: ["sms-batch", batchId] });
      queryClient.invalidateQueries({ queryKey: ["sms-batch-logs", batchId] });
      queryClient.invalidateQueries({ queryKey: ["sms-batches"] });
    },
  });
};
