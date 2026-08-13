import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider, Chip, LinearProgress } from "@mui/material";
import { RefreshCw, X } from "lucide-react";
import { useSnackbar } from "notistack";
import { useSmsBatchDetailQuery, useSmsBatchLogsQuery, useRetrySmsFailedMutation } from "../../hooks/useSmsQuery";
import { formatDate } from "../../hooks/useFormatDate";

const STATUS_COLOR = {
  queued: "default",
  sent: "success",
  failed: "error",
};

export default function BatchDetailModal({ batchId, open, onClose }) {
  const { enqueueSnackbar } = useSnackbar();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const batchQuery = useSmsBatchDetailQuery(batchId, { enabled: open });
  const logsQuery = useSmsBatchLogsQuery(batchId, { page, limit: 20, status: statusFilter || undefined, enabled: open });
  const retryMutation = useRetrySmsFailedMutation();

  const batch = batchQuery.data?.data;
  const logs = logsQuery.data?.data || [];
  const totalPages = logsQuery.data?.totalPages || 1;

  const handleRetry = async () => {
    try {
      const res = await retryMutation.mutateAsync(batchId);
      enqueueSnackbar(res?.message || "Retrying failed messages", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || "Failed to retry", { variant: "error" });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="flex items-center justify-between">
        <span className="font-bold">SMS Batch Detail</span>
        <button onClick={onClose} className="p-1" type="button" aria-label="Close">
          <X size={18} />
        </button>
      </DialogTitle>
      <Divider />
      <DialogContent>
        {batch && (
          <div className="mb-4">
            <div className="bg-gray-50 border rounded-xl p-3 whitespace-pre-wrap text-sm text-gray-800 mb-3">{batch.message}</div>
            <div className="flex flex-wrap gap-3 items-center text-sm text-gray-600">
              <span className="capitalize">
                Mode: <b>{batch.mode}</b>
              </span>
              <span>
                Total: <b>{batch.totalRecipients}</b>
              </span>
              <span>
                Sent: <b className="text-green-700">{batch.sentCount}</b>
              </span>
              <span>
                Failed: <b className="text-red-700">{batch.failedCount}</b>
              </span>
              <Chip size="small" label={String(batch.status).replace(/_/g, " ")} />
              <span>Provider: {batch.provider}</span>
              <span>{formatDate(batch.createdAt)}</span>
            </div>
            {batch.status === "processing" && (
              <div className="mt-3">
                <LinearProgress
                  variant="determinate"
                  value={
                    batch.totalRecipients
                      ? Math.min(100, ((batch.sentCount + batch.failedCount) / batch.totalRecipients) * 100)
                      : 0
                  }
                />
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mb-3">
          {["", "sent", "failed", "queued"].map((s) => (
            <Chip
              key={s || "all"}
              label={s || "All"}
              size="small"
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              color={statusFilter === s ? "primary" : "default"}
              variant={statusFilter === s ? "filled" : "outlined"}
              className="cursor-pointer capitalize"
            />
          ))}
        </div>

        <div className="max-h-72 overflow-y-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left p-2">Recipient</th>
                <th className="text-left p-2">Phone</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Error</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="border-t">
                  <td className="p-2">{log.recipient_name || "-"}</td>
                  <td className="p-2">{log.phone}</td>
                  <td className="p-2">
                    <Chip size="small" label={log.status} color={STATUS_COLOR[log.status]} />
                  </td>
                  <td className="p-2 text-red-600">{log.error || "-"}</td>
                </tr>
              ))}
              {!logs.length && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">
                    No messages found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-3">
            <Button size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </Button>
            <span className="text-sm self-center">
              Page {page} of {totalPages}
            </span>
            <Button size="small" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </DialogContent>
      <DialogActions className="px-6 pb-5">
        {batch?.failedCount > 0 && batch.status !== "processing" && (
          <Button
            startIcon={<RefreshCw size={16} />}
            variant="outlined"
            onClick={handleRetry}
            disabled={retryMutation.isPending}
            className="rounded-xl"
          >
            {retryMutation.isPending ? "Retrying..." : `Retry ${batch.failedCount} failed`}
          </Button>
        )}
        <Button variant="contained" onClick={onClose} className="rounded-xl bg-primary!">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
