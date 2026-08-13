import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Divider, Chip } from "@mui/material";
import { Send } from "lucide-react";

export default function SendConfirmModal({ open, onClose, onConfirm, loading, count, sample = [], message, mode }) {
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

        <div className="mt-4 bg-gray-50 border rounded-xl p-3 whitespace-pre-wrap text-sm text-gray-800">{message}</div>

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
