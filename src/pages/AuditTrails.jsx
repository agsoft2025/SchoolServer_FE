import { useEffect, useState } from "react";
import { useSnackbar } from "notistack";
import { Box, Chip, Pagination, Select, MenuItem, Collapse } from "@mui/material";
import { useAuditLogsQuery } from "../hooks/useAuditLogsQuery";
import {
    PlusCircle, Pencil, Trash2, Eye, Package,
    LogIn, LogOut, FileSignature, Zap, ChevronDown, ChevronUp, History
} from "lucide-react";

// Icons and styles for each action
const ACTION_CONFIG = {
    CREATE: { icon: PlusCircle, bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200" },
    UPDATE: { icon: Pencil, bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200" },
    DELETE: { icon: Trash2, bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-200" },
    READ: { icon: Eye, bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
    UPDATE_STOCK: { icon: Package, bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
    LOGIN: { icon: LogIn, bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
    LOGOUT: { icon: LogOut, bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200" },
    GENERATE: { icon: FileSignature, bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
    BULK_UPSERT: { icon: Zap, bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200" },
    DEFAULT: { icon: History, bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-200" },
};

const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return date.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true
    });
};

const AuditLogCard = ({ item }) => {
    const [expanded, setExpanded] = useState(false);

    const action = item?.action || "DEFAULT";
    const config = ACTION_CONFIG[action] || ACTION_CONFIG.DEFAULT;
    const Icon = config.icon;

    const username = item?.username || item?.userId?.username || "System/Unknown User";
    const role = item?.actorRole || "-";
    const locationInfo = item?.location_id?.schoolName
        ? `${item.location_id.locationName} / ${item.location_id.schoolName}`
        : item?.location_id?.locationName || "-";

    const hasChanges = item?.changes && Object.keys(item.changes).length > 0;

    return (
        <div className={`relative pl-8 sm:pl-36 py-6 group hover:bg-slate-50/50 rounded-xl transition-colors duration-300 -mx-4 px-4`}>
            {/* Timeline vertical line */}
            <div className="absolute left-6 sm:left-[8.5rem] top-0 bottom-0 w-px bg-slate-200 group-last:bg-transparent transition-colors duration-300"></div>

            {/* Timeline dots / icon */}
            <div className={`absolute left-2 sm:left-[7.25rem] top-6 w-9 h-9 rounded-full border border-white ${config.bg} ${config.text} flex items-center justify-center z-10 shadow-sm ring-4 ring-white transition-transform duration-300 group-hover:scale-110`}>
                <Icon size={16} strokeWidth={2.5} />
            </div>

            {/* Timestamp for Desktop (Left side) */}
            <div className="hidden sm:flex flex-col absolute left-4 top-7 w-[5.5rem] text-right">
                <span className="text-xs font-bold text-slate-800 tracking-tight">{formatDate(item.createdAt).split(', ')[0]}</span>
                <span className="text-[10px] font-medium text-slate-500 mt-0.5">{formatDate(item.createdAt).split(', ')[1]} {formatDate(item.createdAt).split(', ')[2] || ''}</span>
            </div>

            {/* Card Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all duration-300 hover:border-slate-300">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                                {username.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-900 text-sm tracking-tight">{username}</span>
                            {role !== "-" && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                    {role}
                                </span>
                            )}

                            {/* Mobile Timestamp */}
                            <span className="sm:hidden text-[10px] font-medium text-slate-400 ml-auto whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                {formatDate(item.createdAt)}
                            </span>
                        </div>

                        <div className="text-sm text-slate-700 flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-800">{action.replace(/_/g, ' ')}</span>
                            {item?.targetModel && (
                                <>
                                    <span className="text-slate-400 text-xs">on</span>
                                    <span className="font-bold text-[11px] tracking-wide text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md uppercase">
                                        {item.targetModel}
                                    </span>
                                </>
                            )}
                        </div>

                        {item?.description && (
                            <div className="text-sm font-medium text-slate-600 bg-slate-50/80 rounded-xl p-3.5 mt-2 border border-slate-100 shadow-inner">
                                {item.description}
                            </div>
                        )}
                    </div>

                    {hasChanges && (
                        <div className="sm:ml-4 mt-2 sm:mt-0 flex-shrink-0">
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${expanded ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
                                    } border`}
                            >
                                {expanded ? 'Hide Details' : 'View Changes'}
                                {expanded ? <ChevronUp size={14} className="text-indigo-500" /> : <ChevronDown size={14} className="text-slate-400" />}
                            </button>
                        </div>
                    )}
                </div>

                {hasChanges && (
                    <Collapse in={expanded} timeout="auto" unmountOnExit className="mt-4">
                        <div className="bg-[#0f172a] rounded-xl p-4 overflow-x-auto shadow-inner border border-slate-800 relative">
                            <div className="absolute top-0 right-0 p-2 opacity-50 flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            </div>
                            <pre className="text-[11px] leading-5 text-emerald-400/90 font-mono mt-2">
                                {JSON.stringify(item.changes, null, 2)}
                            </pre>
                        </div>
                    </Collapse>
                )}
            </div>
        </div>
    );
};

export default function AuditTrails() {
    const { enqueueSnackbar } = useSnackbar();

    // Pagination states
    const [page, setPage] = useState(1); // MUI Pagination is 1-based
    const [pageSize, setPageSize] = useState(10);

    const { data, isLoading, isError, error, isFetching } = useAuditLogsQuery({
        page: page,
        limit: pageSize,
    });

    useEffect(() => {
        if (isError) {
            enqueueSnackbar(error?.response?.data?.message || "Failed to load audit logs", {
                variant: "error",
            });
        }
    }, [isError, error, enqueueSnackbar]);

    const total = data?.pagination?.total || 0;
    const totalPages = data?.pagination?.totalPages || 0;
    const logs = data?.data || [];

    const handlePageChange = (event, value) => {
        setPage(value);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePageSizeChange = (event) => {
        setPageSize(event.target.value);
        setPage(1); // reset to first page on size change
    };

    return (
        <div className="w-full bg-[#f8fafc] min-h-screen p-4 md:p-6 lg:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 group-hover:w-3"></div>
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 group-hover:bg-indigo-50 transition-colors duration-1000"></div>
                    <div className="space-y-1.5 pl-3 relative z-10">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Audit Trails</h1>
                        <p className="text-slate-500 font-medium max-w-lg">
                            Monitor system activity, user interactions, and data modifications in an intuitive timeline.
                        </p>
                    </div>

                    {isFetching && !isLoading && (
                        <div className="relative z-10 flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 shadow-sm animate-pulse">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                            </span>
                            Updating Live Feed...
                        </div>
                    )}
                </div>

                {/* Timeline Feed Section */}
                <div className="bg-white rounded-3xl p-4 sm:p-8 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] border border-slate-100 relative">
                    {isLoading ? (
                        <div className="space-y-6 py-8 px-4">
                            {[1, 2, 3, 4].map((skeleton) => (
                                <div key={skeleton} className="relative pl-8 sm:pl-36 py-4 animate-pulse">
                                    <div className="absolute left-6 sm:left-[8.5rem] top-0 bottom-0 w-px bg-slate-100"></div>
                                    <div className="absolute left-2 sm:left-[7.25rem] top-8 w-9 h-9 rounded-full bg-slate-200 border-4 border-white shadow-sm"></div>
                                    <div className="hidden sm:block absolute left-4 top-8 w-[5.5rem] h-4 bg-slate-200 rounded"></div>
                                    <div className="bg-white rounded-2xl h-32 border border-slate-100 shadow-sm p-6 ml-2">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                                            <div className="h-5 bg-slate-200 rounded w-1/4"></div>
                                            <div className="h-4 bg-slate-100 rounded-full w-16"></div>
                                        </div>
                                        <div className="h-4 bg-slate-100 rounded w-1/3 mb-4"></div>
                                        <div className="h-10 bg-slate-50 rounded-xl w-3/4"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="py-24 text-center flex flex-col items-center justify-center">
                            <div className="bg-slate-50 rounded-full p-6 mb-5 shadow-inner border border-slate-100 transform transition-transform hover:scale-110 duration-300">
                                <History className="text-slate-300" size={48} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">No activities found</h3>
                            <p className="text-slate-500 font-medium mt-2 max-w-sm">We couldn't find any audit logs matching your current filters and criteria.</p>
                        </div>
                    ) : (
                        <div className="pb-4">
                            {logs.map((item, idx) => (
                                <AuditLogCard key={item._id || idx} item={item} />
                            ))}
                        </div>
                    )}

                    {/* Pagination Options */}
                    {!isLoading && logs.length > 0 && (
                        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
                            <div className="flex items-center gap-3 text-sm font-medium text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                                <span>Showing</span>
                                <Select
                                    value={pageSize}
                                    onChange={handlePageSizeChange}
                                    size="small"
                                    variant="standard"
                                    disableUnderline
                                    sx={{
                                        fontWeight: 'bold',
                                        color: '#334155',
                                        '& .MuiSelect-select': { py: 0.5, px: 2, pr: 4, borderRadius: '8px', backgroundColor: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
                                        '& .MuiSvgIcon-root': { right: '4px' }
                                    }}
                                >
                                    <MenuItem value={10}>10</MenuItem>
                                    <MenuItem value={25}>25</MenuItem>
                                    <MenuItem value={50}>50</MenuItem>
                                    <MenuItem value={100}>100</MenuItem>
                                </Select>
                                <span>rows</span>
                            </div>

                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={handlePageChange}
                                color="primary"
                                shape="circular"
                                size="large"
                                sx={{
                                    '& .MuiPaginationItem-root': {
                                        fontWeight: 'bold',
                                        borderRadius: '50%',
                                        margin: '0 4px',
                                        border: '1px solid #e2e8f0',
                                        backgroundColor: '#fff',
                                        color: '#475569',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            backgroundColor: '#f1f5f9',
                                            borderColor: '#cbd5e1'
                                        },
                                        '&.Mui-selected': {
                                            background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                                            color: '#fff',
                                            border: 'none',
                                            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)',
                                            '&:hover': {
                                                background: 'linear-gradient(to right, #4f46e5, #7c3aed)',
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
