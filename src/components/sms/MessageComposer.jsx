import { TextField, Chip } from "@mui/material";

const PLACEHOLDERS = [
  { key: "student_name", label: "Student Name" },
  { key: "father_name", label: "Father Name" },
  { key: "mother_name", label: "Mother Name" },
  { key: "registration_number", label: "Registration No." },
  { key: "class_name", label: "Class" },
  { key: "section", label: "Section" },
  { key: "hostel_name", label: "Hostel" },
  { key: "board_name", label: "Board" },
];

// GSM-7 default alphabet (simplified) — anything outside this falls back to Unicode
// SMS encoding, which halves the per-segment character budget.
const GSM_7_REGEX = /^[A-Za-z0-9 \r\n@£$¥èéùìòÇØøÅåÉÄÖÑÜ§¿äöñüà#¤%&'()*+,\-./:;<=>?_!"ÆæßÉ{}\n]*$/;

const getSegmentInfo = (message) => {
  const length = message.length;
  const isGsm = GSM_7_REGEX.test(message);
  const singleLimit = isGsm ? 160 : 70;
  const multiLimit = isGsm ? 153 : 67;
  const segments = length === 0 ? 0 : length <= singleLimit ? 1 : Math.ceil(length / multiLimit);

  return { encoding: isGsm ? "GSM-7" : "Unicode", segments, length };
};

export default function MessageComposer({ value, onChange, disabled }) {
  const { encoding, segments, length } = getSegmentInfo(value || "");

  const insertPlaceholder = (key) => {
    onChange(`${value || ""}{{${key}}}`);
  };

  return (
    <div>
      <TextField
        fullWidth
        multiline
        minRows={4}
        label="Message"
        placeholder="Dear {{student_name}}, ..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />

      <div className="flex flex-wrap gap-2 mt-2">
        {PLACEHOLDERS.map((placeholder) => (
          <Chip
            key={placeholder.key}
            label={placeholder.label}
            size="small"
            onClick={() => insertPlaceholder(placeholder.key)}
            disabled={disabled}
            className="cursor-pointer"
          />
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-2">
        {length} characters · {encoding} · {segments} segment{segments === 1 ? "" : "s"}
      </p>
    </div>
  );
}
