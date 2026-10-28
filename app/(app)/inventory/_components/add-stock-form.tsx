"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FormMessage,
  SelectField,
  SubmitLabel,
  TextAreaField,
  TextField,
  submitClass,
} from "@/components/form";
import { callApi } from "@/lib/client-api";
import { useApiForm } from "@/lib/use-api-form";
import { field, optionalField, optionalNumber } from "@/lib/use-form-submit";

export type StockProduct = {
  id: number;
  label: string;
  prefix: string;
  type: string;
};

type Added = { quantity: number; items: { id: number; code: string }[] };

const fields = [
  "productId",
  "quantity",
  "codeSuffix",
  "serialNumber",
  "condition",
  "nextCalibrationDueAt",
  "note",
];

// MAX_ADD_STOCK_QUANTITY in nest-ims.
const MAX_QUANTITY = 10_000;

export function AddStockForm({
  products,
  productId,
}: {
  products: StockProduct[];
  productId?: number;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"bulk" | "single">("bulk");
  const [selected, setSelected] = useState(productId ?? 0);
  const product = products.find((option) => option.id === selected);

  const { state, pending, onSubmit } = useApiForm(
    (form) => {
      const productId = Number(field(form, "productId"));
      if (mode === "bulk") {
        return callApi<Added>("/items/bulk", {
          body: { productId, quantity: Number(field(form, "quantity")) },
        });
      }
      return callApi<Added | { id: number }>("/items", {
        body: {
          productId,
          codeSuffix: optionalField(form, "codeSuffix"),
          serialNumber: optionalField(form, "serialNumber"),
          condition:
            product?.type === "consumable"
              ? null
              : optionalNumber(form, "condition"),
          nextCalibrationDueAt:
            product?.type === "calibrated"
              ? optionalField(form, "nextCalibrationDueAt")
              : null,
          note: optionalField(form, "note"),
        },
      });
    },
    {
      fields,
      refresh: false,
      onSuccess(saved, form) {
        if (!("items" in saved)) return router.push(`/inventory/${saved.id}`);
        form.reset();
        const codes = saved.items.map((item) => item.code);
        return {
          tone: "success",
          message:
            codes.length === 1
              ? `Added 1 item: ${codes[0]}.`
              : `Added ${saved.quantity} items: ${codes[0]} to ${codes.at(-1)}.`,
        };
      },
    },
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormMessage message={state.message} tone={state.tone} />

      <SelectField
        id="productId"
        label="Product"
        required
        value={selected || ""}
        onChange={(event) => setSelected(Number(event.target.value))}
        error={errors.productId}
      >
        <option value="" disabled>
          Choose a product
        </option>
        {products.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </SelectField>

      <fieldset>
        <legend className="text-sm font-medium">How many</legend>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
          {(
            [
              ["bulk", "Several", "Numbered automatically"],
              ["single", "One", "With its own code or serial number"],
            ] as const
          ).map(([value, label, hint]) => (
            <label
              key={value}
              className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-checked:border-primary has-checked:bg-primary/5"
            >
              <input
                type="radio"
                name="mode"
                value={value}
                checked={mode === value}
                onChange={() => setMode(value)}
                className="mt-0.5 size-5 shrink-0 accent-primary"
              />
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-sm text-muted">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {mode === "bulk" ? (
        <TextField
          id="quantity"
          label="Quantity"
          type="number"
          required
          min={1}
          max={MAX_QUANTITY}
          step={1}
          inputMode="numeric"
          hint={
            product
              ? `Each gets the next code, such as ${product.prefix}-000001.`
              : undefined
          }
          error={errors.quantity}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="codeSuffix"
            label="Code suffix (optional)"
            pattern="[A-Za-z0-9]{1,20}"
            maxLength={20}
            autoCapitalize="characters"
            hint={
              product
                ? `The code is ${product.prefix}-<suffix>. Empty: the next number.`
                : "Empty: the next number."
            }
            error={errors.codeSuffix}
          />
          <TextField
            id="serialNumber"
            label="Serial number (optional)"
            maxLength={100}
            autoComplete="off"
            error={errors.serialNumber}
          />
          {product?.type !== "consumable" && (
            <TextField
              id="condition"
              label="Condition % (optional)"
              type="number"
              min={0}
              max={100}
              step={1}
              inputMode="numeric"
              hint="Empty: 100, as new."
              error={errors.condition}
            />
          )}
          {product?.type === "calibrated" && (
            <TextField
              id="nextCalibrationDueAt"
              label="Next calibration due (optional)"
              type="date"
              hint="Empty: one interval from today."
              error={errors.nextCalibrationDueAt}
            />
          )}
          <div className="sm:col-span-2">
            <TextAreaField
              id="note"
              label="Note (optional)"
              maxLength={500}
              error={errors.note}
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`${submitClass} sm:w-auto`}
      >
        <SubmitLabel
          pending={pending}
          label="Add stock"
          pendingLabel="Adding…"
        />
      </button>
    </form>
  );
}
