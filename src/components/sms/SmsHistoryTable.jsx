import { useMemo, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Chip } from "@mui/material";
import { useSmsBatchesQuery } from "../../hooks/useSmsQuery";
import { formatDate } from "../../hooks/useFormatDate";

const STATUS_COLOR = {
  processing: "warning",
  completed: "success",
  completed_with_errors: "warning",
  failed: "error",
};

export default function SmsHistoryTable({ onSelectBatch }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isFetching } = useSmsBatchesQuery({ page: page + 1, limit: pageSize });

  const rows = useMemo(
    () =>
      (data?.data || []).map((batch) => ({
        id: batch._id,
        mode: batch.mode,
        message: batch.message,
        totalRecipients: batch.totalRecipients,
        sentCount: batch.sentCount,
        failedCount: batch.failedCount,
        status: batch.status,
        provider: batch.provider,
        createdBy: batch.created_by?.username || batch.created_by?.fullname || "-",
        createdAt: batch.createdAt,
      })),
    [data]
  );

  const columns = [
    { field: "mode", headerName: "Mode", width: 110, renderCell: (params) => <span className="capitalize">{params.value}</span> },
    { field: "message", headerName: "Message", flex: 1, minWidth: 220 },
    { field: "totalRecipients", headerName: "Total", width: 80 },
    { field: "sentCount", headerName: "Sent", width: 80 },
    { field: "failedCount", headerName: "Failed", width: 80 },
    {
      field: "status",
      headerName: "Status",
      width: 170,
      renderCell: (params) => (
        <Chip size="small" label={String(params.value).replace(/_/g, " ")} color={STATUS_COLOR[params.value] || "default"} />
      ),
    },
    { field: "provider", headerName: "Provider", width: 100 },
    { field: "createdBy", headerName: "Sent By", width: 130 },
    { field: "createdAt", headerName: "Date", width: 170, renderCell: (params) => formatDate(params.value) },
  ];

  return (
    <div style={{ height: 520, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={isLoading || isFetching}
        paginationMode="server"
        rowCount={data?.totalItems || 0}
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={(model) => {
          setPage(model.page);
          setPageSize(model.pageSize);
        }}
        pageSizeOptions={[10, 20, 50]}
        onRowClick={(params) => onSelectBatch(params.row.id)}
        disableRowSelectionOnClick
        sx={{
          "& .MuiDataGrid-row": { cursor: "pointer" },
          "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f8fafc" },
        }}
      />
    </div>
  );
}
