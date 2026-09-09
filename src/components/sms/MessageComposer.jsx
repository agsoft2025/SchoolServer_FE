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
 * value: { templateId, variables:{ [inputFieldKey]: string } }
 * onChange is called with { templateId, variables, ready, preview }
 */
export default function MessageComposer({ value, onChange, disabled }) {
  const { templateId = "", variables = {} } = value || {};
  const { data, isLoading, isError } = useSmsTemplatesQuery();

  // Only templates that can actually be sent: a stable id, a name to show, the
  // approved text to preview/assemble, and at least one {#...#} slot spec. A
  // stale or misconfigured backend can return partial rows — keep them out of
  // the picker instead of rendering a blank option.
  const templates = useMemo(() => {
    const rows = Array.isArray(data?.data) ? data.data : [];
    return rows.filter(
      (t) => t && t.id != null && t.name && t.approvedText && Array.isArray(t.fields) && t.fields.length > 0,
    );
  }, [data]);

  const template = useMemo(
    () => templates.find((t) => String(t.id) === String(templateId)),
    [templates, templateId],
  );

  const emit = useCallback(
    (nextId, nextVars) => {
      const tpl = templates.find((t) => String(t.id) === String(nextId));
      onChange({
        templateId: nextId ? String(nextId) : "",
        variables: nextVars,
        ready: computeReady(tpl, nextVars),
        preview: buildPreview(tpl, nextVars),
      });
    },
    [templates, onChange],
  );

  // Auto-select when exactly one approved template exists.
  useEffect(() => {
    if (!templateId && templates.length === 1) emit(templates[0].id, {});
  }, [templates, templateId, emit]);

  if (isLoading) return <CircularProgress size={20} />;

  if (isError)
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">Couldn&apos;t load SMS templates</p>
        <p className="mt-1">
          The template service didn&apos;t respond. Check your connection and try again in a moment.
        </p>
      </div>
    );

  if (!templates.length)
    return (
      <div className="rounded-xl border border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
        <p className="font-semibold">No SMS templates available</p>
        <p className="mt-1">
          There are no active, DLT-approved templates for this school yet. A Super Admin needs to add one and mark it
          <span className="font-medium"> Active</span> (with a DLT Template ID) in <span className="font-medium">SMS
          Template Management</span>. A template that is still Inactive or missing its DLT ID will not appear here.
        </p>
      </div>
    );

  const inputFields = (template?.fields || []).filter((f) => f.source === "input");
  const recordFields = (template?.fields || []).filter((f) => f.source === "record");

  return (
    <div className="flex flex-col gap-3">
      <TextField
        select
        fullWidth
        label="SMS template (DLT-approved)"
        value={templateId}
        onChange={(e) => emit(e.target.value, {})}
        disabled={disabled}
      >
        {templates.map((t) => (
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

          <SmsPhonePreview template={template} variables={variables} />

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
