import { useEffect, useState } from "react";
import { Autocomplete, TextField, Chip, CircularProgress } from "@mui/material";
import useDebounce from "../../hooks/useDebounce";
import { useStudentsQuery } from "../../hooks/useStudentExactQuery";
import { useClassGroupsQuery } from "../../hooks/useSmsQuery";

// mode-aware recipient selector: individual (single student search), classwise
// (multi-select of class+section groups), bulk (optional name/reg-no filter over
// every active student in scope). Reports the selection back via onChange so the
// parent can drive live preview + the confirm-send payload.
export default function RecipientPicker({ mode, locationId, onChange }) {
  const [studentSearch, setStudentSearch] = useState("");
  const debouncedStudentSearch = useDebounce(studentSearch, 400);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const studentsQuery = useStudentsQuery({ search: debouncedStudentSearch, page: 1, limit: 10 });

  const classGroupsQuery = useClassGroupsQuery(locationId);
  const [selectedClasses, setSelectedClasses] = useState([]);

  const [bulkSearch, setBulkSearch] = useState("");
  const debouncedBulkSearch = useDebounce(bulkSearch, 400);

  useEffect(() => {
    setSelectedStudent(null);
    setSelectedClasses([]);
    setBulkSearch("");
  }, [mode]);

  useEffect(() => {
    if (mode === "individual") {
      onChange({ studentId: selectedStudent?._id || null });
    } else if (mode === "classwise") {
      onChange({ classIds: selectedClasses.map((c) => c._id) });
    } else if (mode === "bulk") {
      onChange({ search: debouncedBulkSearch || undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedStudent, selectedClasses, debouncedBulkSearch]);

  if (mode === "individual") {
    const options = studentsQuery.data?.data || [];

    return (
      <Autocomplete
        options={options}
        loading={studentsQuery.isFetching}
        getOptionLabel={(option) => `${option.student_name} (${option.registration_number})`}
        isOptionEqualToValue={(option, value) => option._id === value._id}
        value={selectedStudent}
        onChange={(_, value) => setSelectedStudent(value)}
        onInputChange={(_, value) => setStudentSearch(value)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search student by name or registration number"
            placeholder="Type at least 2 characters"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {studentsQuery.isFetching ? <CircularProgress size={16} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    );
  }

  if (mode === "classwise") {
    const groups = classGroupsQuery.data?.data || [];

    return (
      <Autocomplete
        multiple
        options={groups}
        loading={classGroupsQuery.isLoading}
        getOptionLabel={(option) =>
          `${option.class_name} - ${option.section}${option.academic_year ? ` (${option.academic_year})` : ""} · ${option.count} students`
        }
        isOptionEqualToValue={(option, value) => option._id === value._id}
        value={selectedClasses}
        onChange={(_, value) => setSelectedClasses(value)}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip label={`${option.class_name}-${option.section}`} {...getTagProps({ index })} key={option._id} size="small" />
          ))
        }
        renderInput={(params) => <TextField {...params} label="Select class(es) & section(s)" placeholder="Class - Section" />}
      />
    );
  }

  return (
    <div>
      <TextField
        fullWidth
        label="Optional filter (name or registration number)"
        placeholder="Leave empty to target every active student in scope"
        value={bulkSearch}
        onChange={(e) => setBulkSearch(e.target.value)}
      />
      <p className="text-xs text-gray-500 mt-2">
        Bulk mode targets every active student in your current location{bulkSearch ? " matching this filter" : ""}.
      </p>
    </div>
  );
}
