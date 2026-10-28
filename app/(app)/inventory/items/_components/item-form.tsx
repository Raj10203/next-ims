"use client";

import {
  FormMessage,
  SubmitLabel,
  TextAreaField,
  TextField,
  submitClass,
} from "@/components/form";
import { callApi } from "@/lib/client-api";
import { useApiForm } from "@/lib/use-api-form";
import { field, optionalField } from "@/lib/use-form-submit";

const fields = ["serialNumber", "condition", "nextCalibrationDueAt", "note"];

export type EditedItem = {
  id: number;
  productType: string;
  serialNumber: string | null;
  condition: number | null;
  nextCalibrationDueAt: string | null;
  note: string | null;
};

// PATCH /items/:id takes no null condition or due date, so those are only
// sent for the product types that have them.
export function ItemForm({ item }: { item: EditedItem }) {
  const tracksCondition = item.productType !== "consumable";
  const calibrated = item.productType === "calibrated";

  const { state, pending, onSubmit } = useApiForm(
    (form) => {
      const due = field(form, "nextCalibrationDueAt");
      return callApi(`/items/${item.id}`, {
        method: "PATCH",
        body: {
          serialNumber: optionalField(form, "serialNumber"),
          note: optionalField(form, "note"),
          ...(tracksCondition && {
            condition: Number(field(form, "condition")),
          }),
          ...(calibrated && due && { nextCalibrationDueAt: due }),
        },
      });
    },
    { fields, onSuccess: () => ({ tone: "success", message: "Saved." }) },
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormMessage message={state.message} tone={state.tone} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="serialNumber"
          label="Serial number (optional)"
          maxLength={100}
          autoComplete="off"
          defaultValue={item.serialNumber ?? ""}
          error={errors.serialNumber}
        />
        {tracksCondition && (
          <TextField
            id="condition"
            label="Condition %"
            type="number"
            required
            min={0}
            max={100}
            step={1}
            inputMode="numeric"
            defaultValue={item.condition ?? 100}
            hint="A change is added to the item's history, with the note."
            error={errors.condition}
          />
        )}
        {calibrated && (
          <TextField
            id="nextCalibrationDueAt"
            label="Next calibration due"
            type="date"
            defaultValue={item.nextCalibrationDueAt ?? ""}
            error={errors.nextCalibrationDueAt}
          />
        )}
        <div className="sm:col-span-2">
          <TextAreaField
            id="note"
            label="Note (optional)"
            maxLength={500}
            defaultValue={item.note ?? ""}
            error={errors.note}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className={`${submitClass} sm:w-auto`}
      >
        <SubmitLabel
          pending={pending}
          label="Save changes"
          pendingLabel="Saving…"
        />
      </button>
    </form>
  );
}
