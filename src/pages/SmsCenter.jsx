import { useMemo, useState } from "react";
import { Tabs, Tab, Button, Paper } from "@mui/material";
import { Users, User, GraduationCap, History as HistoryIcon } from "lucide-react";
import { useSnackbar } from "notistack";
import { useLocationCtx } from "../context/LocationContext";
import MessageComposer from "../components/sms/MessageComposer";
import RecipientPicker from "../components/sms/RecipientPicker";
import SendConfirmModal from "../components/sms/SendConfirmModal";
import SmsHistoryTable from "../components/sms/SmsHistoryTable";
import BatchDetailModal from "../components/sms/BatchDetailModal";
import { useSmsPreviewQuery, useSendSmsMutation } from "../hooks/useSmsQuery";

const TABS = [
  { key: "individual", label: "Individual", icon: User },
  { key: "bulk", label: "Bulk", icon: Users },
  { key: "classwise", label: "Classwise", icon: GraduationCap },
  { key: "history", label: "History", icon: HistoryIcon },
];

export default function SmsCenter() {
  const { enqueueSnackbar } = useSnackbar();
  const { selectedLocation } = useLocationCtx();

  const [activeTab, setActiveTab] = useState("individual");
  const [message, setMessage] = useState("");
  const [selectionPayload, setSelectionPayload] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState(null);

  const sendMode = activeTab === "history" ? null : activeTab;

  const previewPayload = useMemo(
    () => (sendMode ? { mode: sendMode, locationId: selectedLocation?._id, ...selectionPayload } : null),
    [sendMode, selectedLocation?._id, selectionPayload]
  );

  const hasSelection =
    sendMode === "bulk" ||
    (sendMode === "individual" && !!selectionPayload.studentId) ||
    (sendMode === "classwise" && (selectionPayload.classIds || []).length > 0);

  const previewQuery = useSmsPreviewQuery(previewPayload, { enabled: !!sendMode && hasSelection });
  const sendMutation = useSendSmsMutation();

  const handleTabChange = (_, value) => {
    setActiveTab(value);
    setSelectionPayload({});
  };

  const handleSend = async () => {
    try {
      const res = await sendMutation.mutateAsync({
        mode: sendMode,
        message,
        locationId: selectedLocation?._id,
        ...selectionPayload,
      });
      enqueueSnackbar(res?.message || `Queued SMS for ${res?.totalRecipients ?? 0} recipients`, { variant: "success" });
      setConfirmOpen(false);
      setActiveBatchId(res?.batchId);
      setActiveTab("history");
      setMessage("");
      setSelectionPayload({});
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || "Failed to send SMS", { variant: "error" });
    }
  };

  return (
    <div className="mx-4">
      <div>
        <h1 className="text-2xl font-bold">SMS Center</h1>
        <h3 className="text-md md:text-lg py-3 md:py-0">
          Send SMS to an individual student, a whole class &amp; section, or in bulk across your location
        </h3>
      </div>

      <Paper className="rounded-2xl! mt-4">
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" allowScrollButtonsMobile>
          {TABS.map((tab) => (
            <Tab key={tab.key} value={tab.key} icon={<tab.icon size={16} />} iconPosition="start" label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      {activeTab === "history" ? (
        <div className="mt-4">
          <SmsHistoryTable onSelectBatch={setActiveBatchId} />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Paper className="rounded-2xl! p-4">
            <h3 className="font-semibold mb-3">Recipients</h3>
            <RecipientPicker mode={activeTab} locationId={selectedLocation?._id} onChange={setSelectionPayload} />

            <div className="mt-4 text-sm">
              {hasSelection ? (
                previewQuery.isFetching ? (
                  <span className="text-gray-500">Calculating recipients...</span>
                ) : (
                  <span className="text-gray-700">
                    Matches <b>{previewQuery.data?.count ?? 0}</b> recipient{previewQuery.data?.count === 1 ? "" : "s"}
                  </span>
                )
              ) : (
                <span className="text-gray-400">Select recipients to see how many will receive this message.</span>
              )}
            </div>
          </Paper>

          <Paper className="rounded-2xl! p-4">
            <h3 className="font-semibold mb-3">Message</h3>
            <MessageComposer value={message} onChange={setMessage} />

            <Button
              variant="contained"
              className="mt-4 rounded-xl text-white bg-primary!"
              disabled={!message.trim() || !hasSelection}
              onClick={() => setConfirmOpen(true)}
            >
              Review &amp; Send
            </Button>
          </Paper>
        </div>
      )}

      <SendConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSend}
        loading={sendMutation.isPending}
        count={previewQuery.data?.count ?? 0}
        sample={previewQuery.data?.sample ?? []}
        message={message}
        mode={sendMode}
      />

      <BatchDetailModal batchId={activeBatchId} open={!!activeBatchId} onClose={() => setActiveBatchId(null)} />
    </div>
  );
}
