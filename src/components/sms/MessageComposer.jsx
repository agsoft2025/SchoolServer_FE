import { useCallback, useEffect, useMemo } from "react";
import { TextField, MenuItem, CircularProgress } from "@mui/material";
import { useSmsTemplatesQuery } from "../../hooks/useSmsQuery";

// Student-sourced variables differ per recipient, so the preview shows a
// readable token for them; 'input' variables use what staff typed.
const buildPreview = (template, variables) => {
  if (!template) return "";
  let out = template.body;
  (template.variables || []).forEach((v) => {
    const token =
      v.source === "input"
        ? (variables?.[v.key] || "").trim() || `[${v.label.toLowerCase()}]`
        : `[${v.source.replace(/_/g, " ")}]`;
    out = out.split(`{{${v.key}}}`).join(token);
  });
  return out;
};

const computeReady = (template, variables) =>
  !!template &&
  (template.variables || [])
    .filter((v) => v.source === "input")
    .every((v) => String(variables?.[v.key] || "").trim());

/**
 * value: { templateId, variables:{ [key]: string } }
 * onChange is called with { templateId, variables, ready, preview }
 */
export default function MessageComposer({ value, onChange, disabled }) {
  const { templateId = "", variables = {} } = value || {};
  const { data, isLoading } = useSmsTemplatesQuery();
  const templates = useMemo(() => data?.data || [], [data]);

  const template = useMemo(
    () => templates.find((t) => String(t.id) === String(templateId)),
    [templates, templateId]
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
    [templates, onChange]
  );

  // Auto-select when exactly one approved template exists.
  useEffect(() => {
    if (!templateId && templates.length === 1) emit(templates[0].id, {});
  }, [templates, templateId, emit]);

  if (isLoading) return <CircularProgress size={20} />;

  if (!templates.length)
    return (
      <p className="text-sm text-red-600">
        No approved SMS templates are configured. Add one in the backend config (src/config/smsTemplates.js).
      </p>
    );

  const inputVars = (template?.variables || []).filter((v) => v.source === "input");

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
            {t.label}
          </MenuItem>
        ))}
      </TextField>

      {inputVars.map((v) => (
        <TextField
          key={v.key}
          fullWidth
          multiline
          minRows={2}
          label={v.label}
          value={variables[v.key] || ""}
          onChange={(e) => emit(templateId, { ...variables, [v.key]: e.target.value })}
          disabled={disabled}
        />
      ))}

      {template && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">Preview</p>
          <div className="bg-gray-50 border rounded-xl p-3 whitespace-pre-wrap text-sm text-gray-800">
            {buildPreview(template, variables)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Only the approved template content is sent. Bracketed fields are filled in per recipient.
          </p>
        </div>
      )}
    </div>
  );
}
