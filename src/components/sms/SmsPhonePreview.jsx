import { useMemo } from "react";
import { ChevronLeft, ChevronRight, SignalHigh, Wifi, BatteryFull } from "lucide-react";

const DLT_TOKEN = /\{#\s*[A-Za-z0-9_]+\s*#\}/g;

// Split the approved template text into ordered render segments. Static text
// (including the signature) is preserved BYTE-FOR-BYTE; only the {#...#} slots
// become chips. Slot i maps to template.fields[i].
export const buildSegments = (template, variables = {}) => {
  if (!template?.approvedText) return [];
  const fields = template.fields || [];
  const text = template.approvedText;
  const re = new RegExp(DLT_TOKEN.source, "g");

  const segments = [];
  let last = 0;
  let slot = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) segments.push({ type: "text", value: text.slice(last, match.index) });

    const token = match[0];
    const field = fields[slot];
    if (!field) {
      segments.push({ type: "slot", kind: "unknown", token, label: "value" });
    } else if (field.source === "record") {
      segments.push({ type: "slot", kind: "record", token, label: field.label });
    } else {
      const v = String(variables?.[field.key] ?? "").trim();
      segments.push({ type: "slot", kind: "input", token, label: field.label, value: v, filled: v.length > 0 });
    }

    last = match.index + token.length;
    slot += 1;
  }
  if (last < text.length) segments.push({ type: "text", value: text.slice(last) });
  return segments;
};

// Plain string for the character counter — mirrors what a recipient roughly sees
// (filled inputs inline, unfilled/record slots shown as [Label]).
const segmentsToText = (segments) =>
  segments
    .map((s) => {
      if (s.type === "text") return s.value;
      if (s.kind === "input" && s.filled) return s.value;
      return `[${s.label}]`;
    })
    .join("");

const initialsFrom = (name = "") => {
  const letters = name.replace(/[^A-Za-z]/g, "");
  return (letters.slice(0, 2) || "AG").toUpperCase();
};

const nowClock = () =>
  new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const Slot = ({ children, tone }) => {
  const tones = {
    rose: "border-rose-400 text-rose-500",
    sky: "border-sky-400 text-sky-600",
    gray: "border-gray-400 text-gray-500",
  };
  return (
    <span
      className={`mx-0.5 inline-flex items-center rounded-md border border-dashed px-1.5 py-[1px] align-baseline text-[0.82em] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

/**
 * Phone-style SMS preview.
 *  - Rich mode: pass `template` (+ `variables`) to render slot chips.
 *  - Plain mode: pass `text` (the already-assembled message) — used at send time.
 */
export default function SmsPhonePreview({ template, variables = {}, text, senderId = "AGSWSL", className = "" }) {
  const segments = useMemo(
    () => (template ? buildSegments(template, variables) : null),
    [template, variables],
  );

  const clock = useMemo(nowClock, []);
  const initials = initialsFrom(senderId);
  const plain = segments ? segmentsToText(segments) : text || "";
  const charCount = plain.length;
  const segCount = Math.max(1, Math.ceil(charCount / 160));

  return (
    <div className={`mx-auto w-full max-w-[340px] ${className}`}>
      <div className="overflow-hidden rounded-[2.25rem] border-[6px] border-[#2b3440] bg-white shadow-xl">
        {/* notch + status bar */}
        <div className="relative">
          <div className="absolute left-1/2 top-1.5 h-4 w-24 -translate-x-1/2 rounded-full bg-[#2b3440]" />
          <div className="flex items-center justify-between px-5 pb-1 pt-3 text-[12px] font-semibold text-gray-900">
            <span>{clock}</span>
            <span className="flex items-center gap-1">
              <SignalHigh size={14} strokeWidth={2.5} />
              <span className="text-[11px]">5G</span>
              <Wifi size={14} strokeWidth={2.5} />
              <BatteryFull size={16} strokeWidth={2} />
            </span>
          </div>
        </div>

        {/* contact header */}
        <div className="border-b border-gray-200 px-3 pb-3 pt-1">
          <div className="flex items-center">
            <ChevronLeft size={22} className="shrink-0 text-sky-500" />
            <div className="flex flex-1 flex-col items-center">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gray-400 text-[13px] font-semibold text-white">
                {initials}
              </div>
              <div className="mt-1 flex items-center gap-0.5 text-[12px] font-medium text-gray-600">
                <span className="max-w-[180px] truncate">{senderId}</span>
                <ChevronRight size={13} className="shrink-0" />
              </div>
            </div>
            <span className="w-[22px] shrink-0" />
          </div>
        </div>

        {/* thread */}
        <div className="min-h-[240px] bg-white px-3 py-4">
          <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Text Message
            <br />
            <span className="font-medium normal-case tracking-normal">Today {clock}</span>
          </p>

          <div className="mt-4 flex">
            <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-[20px] rounded-bl-[6px] bg-[#e9e9eb] px-3.5 py-2.5 text-[15px] leading-snug text-gray-900">
              {segments
                ? segments.map((s, i) => {
                    if (s.type === "text") return <span key={i}>{s.value}</span>;
                    if (s.kind === "input" && s.filled)
                      return (
                        <span key={i} className="font-semibold text-gray-900">
                          {s.value}
                        </span>
                      );
                    if (s.kind === "input")
                      return (
                        <Slot key={i} tone="rose">
                          {s.token.replace(/[a-z]+/g, (w) => w.toUpperCase())}
                        </Slot>
                      );
                    if (s.kind === "record")
                      return (
                        <Slot key={i} tone="sky">
                          [{s.label}]
                        </Slot>
                      );
                    return (
                      <Slot key={i} tone="gray">
                        {s.token}
                      </Slot>
                    );
                  })
                : plain || <span className="text-gray-400">Nothing to preview yet.</span>}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] leading-relaxed text-gray-500">
        {charCount} characters{charCount > 160 ? ` · ${segCount} SMS segments` : ""} · only the approved template content
        is sent · <span className="text-sky-600">blue</span> fields fill from each student&apos;s record ·{" "}
        <span className="text-rose-500">red</span> fields are what you type
      </p>
    </div>
  );
}
