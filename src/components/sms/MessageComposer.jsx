import { useCallback, useEffect, useMemo } from "react";
import { TextField, MenuItem, CircularProgress } from "@mui/material";
import { Info } from "lucide-react";
import { useSmsTemplatesQuery } from "../../hooks/useSmsQuery";
import SmsPhonePreview from "./SmsPhonePreview";

const DLT_TOKEN = /\{#\s*[A-Za-z0-9_]+\s*#\}/g;

// PREVIEW ONLY. The final SMS is assembled on the backend from the approved text
// + validated values. 'record' fields differ per recipient so they show as a
// labelled token; 'input' fields show what the sender typed.
const buildPreview = (template, variables) => {
  if (!template?.approvedText) return "";
  const fields = template.fields || [];
  let i = 0;
  return template.approvedText.replace(DLT_TOKEN, () => {
    const f = fields[i++];
    if (!f) return "____";
    if (f.source === "record") return `[${f.label}]`;
    const v = (variables?.[f.key] || "").trim();
    return v || `[${f.label}]`;
  });
};

const computeReady = (template, variables) => {
  if (!template) return false;
  return (template.fields || [])
    .filter((f) => f.source === "input" && f.required)
    .every((f) => {
      const v = String(variables?.[f.key] || "").trim();
      return v.length > 0 && v.length <= (f.maxLength || 30);
    });
};

/**
 * value: { templateId, senderId, variables:{ [inputFieldKey]: string } }
 * onChange is called with { templateId, senderId, variables, ready, preview }
 */
export default function MessageComposer({ value, onChange, disabled }) {
  const { templateId = "", senderId = "", variables = {} } = value || {};
  const { data, isLoading, isError } = useSmsTemplatesQuery();

  // Only templates that can actually be sent: a stable id, a name to show, the
  // approved text to preview/assemble, and at least one {#...#} slot spec.
  const templates = useMemo(() => {
    const rows = Array.isArray(data?.data) ? data.data : [];
    return rows.filter(
      (t) => t && t.id != null && t.name && t.approvedText && Array.isArray(t.fields) && t.fields.length > 0,
    );
  }, [data]);

  // Sender IDs this school may send under that actually have >=1 usable template.
  const senders = useMemo(() => {
    const fromApi = Array.isArray(data?.senderIds) ? data.senderIds : [];
    return fromApi.length ? fromApi : [...new Set(templates.map((t) => t.senderId).filter(Boolean))].sort();
  }, [data, templates]);

  const assignedSenderIds = Array.isArray(data?.assignedSenderIds) ? data.assignedSenderIds : [];
  const senderSource = data?.senderSource || "fallback";

  const activeSender = senders.length === 1 ? senders[0] : senderId;

  const visibleTemplates = useMemo(
    () => (activeSender ? templates.filter((t) => t.senderId === activeSender) : templates),
    [templates, activeSender],
  );

  const template = useMemo(
    () => visibleTemplates.find((t) => String(t.id) === String(templateId)),
    [visibleTemplates, templateId],
  );

  const emit = useCallback(
    (nextId, nextVars, nextSender) => {
      const sender = nextSender ?? activeSender;
      const tpl = templates.find((t) => String(t.id) === String(nextId));
      onChange({
        templateId: nextId ? String(nextId) : "",
        senderId: sender || tpl?.senderId || "",
        variables: nextVars,
        ready: computeReady(tpl, nextVars),
        preview: buildPreview(tpl, nextVars),
      });
    },
    [templates, activeSender, onChange],
  );

  // Auto-select the sender when the school has exactly one.
  useEffect(() => {
    if (senders.length === 1 && senderId !== senders[0]) emit(templateId || "", variables, senders[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [senders]);

  // Auto-select the template when exactly one is visible for the active sender.
  useEffect(() => {
    if (!templateId && visibleTemplates.length === 1) emit(visibleTemplates[0].id, {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTemplates, templateId]);

  if (isLoading) return <CircularProgress size={20} />;

  if (isError)
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">Couldn&apos;t load SMS templates</p>
        <p className="mt-1">The template service didn&apos;t respond. Check your connection and try again in a moment.</p>
      </div>
    );

  // No Sender ID the school can actually send with.
  if (senders.length === 0) {
    const assignedButEmpty = senderSource === "config" && assignedSenderIds.length > 0;
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">SMS is not available for your school</p>
        <p className="mt-1">
          {senderSource === "config" && assignedSenderIds.length === 0
            ? "No SMS Sender ID has been assigned to your school. Ask your administrator to assign one."
            : assignedButEmpty
              ? `Your school's Sender ID(s) (${assignedSenderIds.join(", ")}) have no active, DLT-approved templates yet.`
              : "There are no active, DLT-approved templates available for your school yet."}
        </p>
      </div>
    );
  }

  const inputFields = (template?.fields || []).filter((f) => f.source === "input");
  const recordFields = (template?.fields || []).filter((f) => f.source === "record");

  return (
    <div className="flex flex-col gap-3">
      {senders.length > 1 ? (
        <TextField
          select
          fullWidth
          label="SMS Sender ID"
          value={activeSender || ""}
          onChange={(e) => emit("", {}, e.target.value)}
          disabled={disabled}
          helperText="Templates below are the ones registered under this sender."
        >
          {senders.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
      ) : (
        <TextField
          fullWidth
          label="SMS Sender ID"
          value={activeSender || ""}
          disabled
          helperText="Assigned to your school by the Super Admin. Every recipient sees this as the SMS sender."
        />
      )}

      <TextField
        select
        fullWidth
        label="SMS template (DLT-approved)"
        value={templateId}
        onChange={(e) => emit(e.target.value, {})}
        disabled={disabled || !activeSender}
      >
        {visibleTemplates.map((t) => (
          <MenuItem key={t.id} value={String(t.id)}>
            {t.name}
          </MenuItem>
        ))}
      </TextField>

      {inputFields.map((f) => {
        const v = variables[f.key] || "";
        return (
          <TextField
            key={f.key}
            fullWidth
            multiline
            minRows={2}
            label={f.label}
            value={v}
            required={f.required}
            onChange={(e) => emit(templateId, { ...variables, [f.key]: e.target.value })}
            disabled={disabled}
            inputProps={{ maxLength: f.maxLength || undefined }}
            helperText={f.maxLength ? `${v.length}/${f.maxLength}` : undefined}
          />
        );
      })}

      {recordFields.length > 0 && (
        <p className="text-xs text-gray-500">
          Filled from each student&apos;s record (read-only): {recordFields.map((f) => f.label).join(", ")}
        </p>
      )}

      {template && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Preview</p>
            {template.version != null && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                {template.name} · v{template.version}
              </span>
            )}
          </div>

          <SmsPhonePreview template={template} variables={variables} senderId={activeSender || template.senderId} />

          <p className="flex items-start gap-1.5 rounded-lg bg-sky-50 p-2 text-[11px] leading-relaxed text-sky-800">
            <Info size={13} className="mt-[1px] shrink-0" />
            <span>
              This wording is the DLT-approved template set by your Super Admin. If they edit or replace it, the change
              shows up here on its own (within about a minute) — the server always assembles and sends the exact approved
              text, never this on-screen preview.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
