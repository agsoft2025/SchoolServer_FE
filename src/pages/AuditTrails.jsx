import { useEffect, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Chip } from "@mui/material";
import { useAuditLogsQuery } from "../hooks/useAuditLogsQuery";

const ACTION_BADGES = {
    CREATE: "bg-emerald-100 text-emerald-800",
    UPDATE: "bg-amber-100 text-amber-800",
    DELETE: "bg-rose-100 text-rose-800",
    READ: "bg-slate-100 text-slate-600",
    UPDATE_STOCK: "bg-amber-50 text-amber-700",
    LOGIN: "bg-blue-100 text-blue-800",
    LOGOUT: "bg-gray-100 text-gray-800",
    GENERATE: "bg-purple-100 text-purple-800",
    BULK_UPSERT: "bg-indigo-100 text-indigo-800",
};

const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
};


export default function AuditTrails() {
    const { enqueueSnackbar } = useSnackbar();

    // DataGrid uses 0-based page index
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // API uses 1-based page
    const apiPage = page + 1;

    const { data, isLoading, isError, error, isFetching } = useAuditLogsQuery({
        page: apiPage,
        limit: pageSize,
    });

    // ✅ rows exactly like your old table
    const rows = useMemo(() => {
        const list = data?.data ?? [];
        return list.map((item, idx) => ({
            id: item._id ?? `${apiPage}-${idx}`,
            timestamp: item.createdAt,
            username: item?.username || item?.userId?.username || "-",
            role: item?.actorRole || "-",
            targetModel: item?.targetModel || "-",
            description: item?.description || "-",
            action: item?.action || "-",
            location: item?.location_id?.schoolName
                ? `${item.location_id.locationName} / ${item.location_id.schoolName}`
                : item?.location_id?.locationName || "-"
        }));
    }, [data, apiPage]);

    const columns = useMemo(
        () => [
            {
                field: "timestamp",
                headerName: "Date",
                width: 170,
                renderCell: (params) => formatDate(params.value),
            },
            { field: "username", headerName: "User Name", flex: 1, minWidth: 140 },
            { field: "role", headerName: "Role", width: 120 },
            {
                field: "action",
                headerName: "Action",
                width: 140,
                renderCell: (params) => (
                    <span
                        className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase ${
                            ACTION_BADGES[params.value] || ACTION_BADGES.READ
                        }`}
                    >
                        {params.value || "READ"}
                    </span>
                ),
            },
            { field: "targetModel", headerName: "Target Model", flex: 1, minWidth: 140 },
            { field: "description", headerName: "Description", flex: 2, minWidth: 200 },
            { field: "location", headerName: "Location", flex: 1, minWidth: 150 },
        ],
        []
    );

    // ✅ show error once (not on every render)
    useEffect(() => {
        if (isError) {
            enqueueSnackbar(error?.response?.data?.message || "Failed to load audit logs", {
                variant: "error",
            });
        }
    }, [isError, error, enqueueSnackbar]);

    // ✅ Use your backend pagination total (same as table)
    const total = data?.pagination?.total ?? 0;

    return (
        <div className="w-full bg-gray-50 p-1 md:p-5">
            <div className="max-w-8xl mx-auto space-y-6">
                <div className="space-y-2">
                    <h1 className="text-2xl md:text-2xl font-bold text-gray-900 pl-2">Audit Trails</h1>
                    <p className="text-gray-600 text-sm md:text-base pl-2">
                        Monitor system statistics and recent activities
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-xs text-slate-500">
                            {isFetching && !isLoading ? "Updating..." : ""}
                        </div>
                    </div>

                    <Box sx={{ height: "calc(100vh - 300px)", width: "100%" }}>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            loading={isLoading || isFetching}
                            pagination
                            paginationMode="server"
                            rowCount={total}
                            pageSizeOptions={[10, 20, 50]}
                            paginationModel={{ page, pageSize }}
                            onPaginationModelChange={(model) => {
                                const pageChanged = model.page !== page;
                                const sizeChanged = model.pageSize !== pageSize;

                                if (sizeChanged) {
                                    setPage(0);
                                    setPageSize(model.pageSize);
                                    return;
                                }

                                if (pageChanged) {
                                    setPage(model.page);
                                }
                            }}
                            disableRowSelectionOnClick
                            getRowId={(row) => row.id}
                        />

                    </Box>
                </div>
            </div>
        </div>
    );
}
