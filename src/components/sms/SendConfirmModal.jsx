import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Divider, Chip } from "@mui/material";
import { Send } from "lucide-react";
import SmsPhonePreview from "./SmsPhonePreview";

export default function SendConfirmModal({ open, onClose, onConfirm, loading, count, sample = [], message, senderId, mode }) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="flex items-center gap-2">
        <Send size={18} className="text-primary" />
        <span className="font-bold">Confirm SMS Send</span>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Typography className="text-gray-700">
          You are about to send this message to <b>{count}</b> recipient{count === 1 ? "" : "s"} ({mode}).
        </Typography>

        <div className="mt-4">
          <SmsPhonePreview text={message} senderId={senderId || "AGSWSL"} />
        </div>

        {senderId && (
          <p className="text-xs text-gray-600 mt-2">
            Sender ID: <b>{senderId}</b>
          </p>
        )}

        {sample.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Sample recipients</p>
            <div className="flex flex-wrap gap-2">
              {sample.map((recipient, idx) => (
                <Chip key={idx} label={`${recipient.name || "Unknown"} · ${recipient.phone}`} size="small" />
              ))}
            </div>
          </div>
        )}

        <Typography className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-4">
          This cannot be undone once sending starts. Double-check the recipient count before confirming.
        </Typography>
      </DialogContent>

      <DialogActions className="px-6 pb-5">
        <Button variant="outlined" onClick={onClose} disabled={loading} className="rounded-xl">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading || count === 0}
          className="rounded-xl bg-primary!"
        >
          {loading ? "Sending..." : `Send to ${count}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
