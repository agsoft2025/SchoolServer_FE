import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

import { useForm } from "react-hook-form";
import { useSnackbar } from "notistack";
import { useLocationMutation } from "../../hooks/useLocationMutation";
import { useEffect } from "react";
import { useLocationCtx } from "../../context/LocationContext";

export default function LocationDialog({
  open,
  onClose,
  isEdit = false,
  selectedLocation = null,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const locationMutation = useLocationMutation();
  const {
    locations = [],
    loading: locationsLoading,
    selectedLocation: currentLocation,
    selectLocation,
  } = useLocationCtx();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      schoolName: "",
      baseUrl: "",
      locationName: "",
    },
  });

  useEffect(() => {
    if (!open) return;

    if (isEdit && selectedLocation) {
      reset({
        schoolName: selectedLocation.schoolName || "",
        baseUrl: selectedLocation.baseUrl || "",
        locationName: selectedLocation.locationName || "",
      });
    } else {
      reset({
        schoolName: "",
        baseUrl: "",
        locationName: "",
      });
    }
  }, [open, isEdit, selectedLocation, reset]);

  const onSubmit = (values) => {
    locationMutation.mutate(
      {
        isEdit,
        selectedLocation,
        payload: values,
      },
      {
        onSuccess: () => {
          enqueueSnackbar(isEdit ? "Location updated" : "Location created", {
            variant: "success",
          });
          onClose();
        },
        onError: (err) => {
          console.log(err);
          enqueueSnackbar(err?.response?.data?.message || "Something went wrong", {
            variant: "error",
          });
        },
      }
    );
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  const handleSelectLocation = (location) => {
    selectLocation(location);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Select Location</DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-gray-700">Available locations</p>
            {locationsLoading ? (
              <p className="text-xs text-gray-500">Loading locations…</p>
            ) : locations.length === 0 ? (
              <p className="text-xs text-gray-500">
                No locations found. Create one using the form below.
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[12rem] overflow-y-auto pr-1">
                {locations.map((location) => {
                  const locationId = location._id ?? location.id ?? location.locationName;
                  const isSelected =
                    currentLocation?._id === locationId || currentLocation?.id === locationId;
                  return (
                    <button
                      key={locationId}
                      type="button"
                      onClick={() => handleSelectLocation(location)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                        isSelected
                          ? "border-green-500 bg-emerald-50 shadow-sm"
                          : "border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {location.locationName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {location.baseUrl || "No base URL"}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-semibold ${
                            isSelected ? "text-green-600" : "text-slate-500"
                          }`}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <TextField
            label="School Name"
            fullWidth
            size="small"
            {...register("schoolName", { required: "School name is required" })}
            error={!!errors.schoolName}
            helperText={errors.schoolName?.message}
          />

          <TextField
            label="Base URL"
            fullWidth
            size="small"
            placeholder="https://example.com"
            {...register("baseUrl", {
              required: "Base URL is required",
              pattern: {
                value: /^https?:\/\/.+/i,
                message: "Enter a valid URL starting with http/https",
              },
            })}
            error={!!errors.baseUrl}
            helperText={errors.baseUrl?.message}
          />

          <TextField
            label="Location Name"
            fullWidth
            size="small"
            {...register("locationName", {
              required: "Location name is required",
            })}
            error={!!errors.locationName}
            helperText={errors.locationName?.message}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" className="bg-primary!">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
