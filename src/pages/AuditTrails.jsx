import { useEffect, useMemo, useRef } from "react";
import { useSnackbar } from "notistack";
import { Box, Typography, Chip, CircularProgress } from "@mui/material";
import { useAuditLogsQuery } from "../hooks/useAuditLogsQuery";

const ACTION_BADGES = {
    CREATE: "bg-emerald-100 text-emerald-800",
    UPDATE: "bg-amber-100 text-amber-800",
    DELETE: "bg-rose-100 text-rose-800",
    READ: "bg-slate-100 text-slate-600",
    UPDATE_STOCK: "bg-amber-50 text-amber-700",
};

const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
};

export default function AuditTrails() {
    const { enqueueSnackbar } = useSnackbar();
    const sentinelRef = useRef(null);
    const lastFetchRef = useRef(0);

    const {
        data,
        isLoading,
        isError,
        error,
        isFetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useAuditLogsQuery();

    const pages = data?.pages || [];
    const entries = useMemo(() => {
        return pages
            .flatMap((page) => (Array.isArray(page?.data) ? page.data : []))
            .map((item) => ({
                id: item._id,
                user: item.username || item.userId?.username || "-",
                role: item.actorRole || "-",
                action: item.action || "READ",
                description: item.description || "-",
                model: item.targetModel || "-",
                location: item.location_id
                    ? [item.location_id.locationName, item.location_id.schoolName]
                          .filter(Boolean)
                          .join(" / ")
                    : "-",
                timestamp: item.createdAt,
            }));
    }, [pages]);

    const infoMessage = pages[0]?.message;

    useEffect(() => {
        if (isError) {
            enqueueSnackbar(error?.response?.data?.message || "Failed to load audit logs", {
                variant: "error",
            });
        }
    }, [isError, error, enqueueSnackbar]);

    useEffect(() => {
        if (!sentinelRef.current || !hasNextPage) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    const now = Date.now();
                    if (now - lastFetchRef.current < 600) return;
                    lastFetchRef.current = now;
                    fetchNextPage();
                }
            },
            { rootMargin: "200px" }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    const emptyMessage =
        infoMessage || (isError ? error?.response?.data?.message : "No activity yet.");

    return (
        <div className="w-full bg-gray-50 p-3 md:p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-gray-900">Audit Trails</h1>
                    <p className="text-gray-600 text-sm">Readable timeline of every backend action.</p>
                </div>

                <div className="bg-white rounded-2xl shadow p-5 space-y-4">
                    {isLoading ? (
                        <div className="flex items-center gap-3">
                            <CircularProgress size={18} />
                            <Typography variant="body2" color="text.secondary">
                                Loading audit activity...
                            </Typography>
                        </div>
                    ) : null}

                    {isFetching && !isLoading ? (
                        <Typography variant="body2" color="info.main" className="pl-2">
                            Syncing latest activity...
                        </Typography>
                    ) : null}

                    {entries.length === 0 ? (
                        <Typography className="text-center text-gray-500 py-10">{emptyMessage}</Typography>
                    ) : (
                        <Box className="space-y-4 divide-y divide-slate-200">
                            {entries.map((entry) => (
                                <article key={entry.id} className="pt-3">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                            <Typography className="font-medium text-slate-900">{entry.user}</Typography>
                                            <Typography className="text-xs uppercase tracking-wider text-slate-500">
                                                {entry.role}
                                            </Typography>
                                        </div>
                                        <Chip
                                            label={entry.action || "READ"}
                                            className={`text-[10px] font-semibold uppercase ${
                                                ACTION_BADGES[entry.action] || ACTION_BADGES.READ
                                            }`}
                                        />
                                    </div>
                                    <Typography className="text-base mt-2 text-slate-700">{entry.description}</Typography>
                                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-2">
                                        <span className="font-semibold">Model:</span>
                                        <span>{entry.model}</span>
                                        <span className="font-semibold">Location:</span>
                                        <span>{entry.location}</span>
                                        <span>{formatDate(entry.timestamp)}</span>
                                    </div>
                                </article>
                            ))}
                        </Box>
                    )}

                    <div ref={sentinelRef} aria-hidden className="h-2" />

                    {isFetchingNextPage ? (
                        <Typography variant="body2" color="text.secondary" className="text-center">
                            Loading more...
                        </Typography>
                    ) : null}
                    {!hasNextPage && entries.length > 0 ? (
                        <Typography variant="body2" color="text.secondary" className="text-center">
                            You are all caught up.
                        </Typography>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
