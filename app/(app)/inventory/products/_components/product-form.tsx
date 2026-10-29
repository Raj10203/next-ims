"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CheckboxField,
  FormMessage,
  SelectField,
  SubmitLabel,
  TextAreaField,
  TextField,
  submitClass,
} from "@/components/form";
import { SearchSelect } from "@/components/search-select";
import {
  measureTypeLabel,
  packUnitLabel,
  productTypeHint,
  productTypeLabel,
} from "@/lib/catalog-labels";
import { callApi } from "@/lib/client-api";
import type { PickerOption } from "@/lib/pickers";
import { useApiForm } from "@/lib/use-api-form";
import {
  checked,
  field,
  optionalField,
  optionalNumber,
} from "@/lib/use-form-submit";

const fields = [
  "name",
  "prefix",
  "categoryId",
  "type",
  "measureType",
  "packSize",
  "packUnit",
  "calibrationIntervalDays",
  "description",
  "isActive",
];

export type EditedProduct = {
  id: number;
  name: string;
  prefix: string;
  // Kept even when deactivated: the picker only finds active ones.
  category: PickerOption<"category">;
  type: string;
  measureType: string;
  packSize: number | null;
  packUnit: string | null;
  calibrationIntervalDays: number | null;
  description: string | null;
  isActive: boolean;
};

export type ProductChoices = {
  types: string[];
  measureTypes: string[];
  packUnits: string[];
};

// The field rules of product-rules.ts in nest-ims: only consumables may be
// bulk, bulk needs a pack, calibrated needs an interval. Hidden fields are
// sent as null, which PATCH needs when leaving bulk or calibrated. Once a
// product has stock (locked), its code and measure stay as they are.
export function ProductForm({
  product,
  choices,
  locked = false,
}: {
  product?: EditedProduct;
  choices: ProductChoices;
  locked?: boolean;
}) {
  const router = useRouter();
  const [type, setType] = useState(product?.type ?? "");
  const [measureType, setMeasureType] = useState(
    product?.measureType ?? "single",
  );
  const bulk = type === "consumable" && measureType === "bulk";

  const { state, pending, onSubmit } = useApiForm(
    (form) => {
      const identity = locked
        ? {}
        : {
            prefix: field(form, "prefix"),
            type,
            measureType: bulk ? "bulk" : "single",
            packSize: bulk ? optionalNumber(form, "packSize") : null,
            packUnit: bulk ? optionalField(form, "packUnit") : null,
          };
      const body = {
        name: field(form, "name"),
        categoryId: Number(field(form, "categoryId")),
        ...identity,
        calibrationIntervalDays:
          type === "calibrated"
            ? optionalNumber(form, "calibrationIntervalDays")
            : null,
        description: optionalField(form, "description"),
        isActive: checked(form, "isActive"),
      };
      return product
        ? callApi<{ id: number }>(`/products/${product.id}`, {
            method: "PATCH",
            body,
          })
        : callApi<{ id: number }>("/products", { body });
    },
    {
      fields,
      refresh: !!product,
      onSuccess(saved) {
        if (!product) return router.push(`/inventory/products/${saved.id}`);
        return { tone: "success", message: "Saved." };
      },
    },
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormMessage message={state.message} tone={state.tone} />
      {locked && (
        <FormMessage
          tone="info"
          message="This product has stock, so its prefix, type and pack can no longer change."
        />
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="name"
          label="Name"
          required
          maxLength={150}
          defaultValue={product?.name}
          error={errors.name}
        />
        <TextField
          id="prefix"
          label="Code prefix"
          required
          disabled={locked}
          pattern="[A-Za-z0-9]{2,10}"
          minLength={2}
          maxLength={10}
          autoCapitalize="characters"
          defaultValue={product?.prefix}
          hint="2–10 letters or digits. Item codes start with it: DRL-000001."
          error={errors.prefix}
        />
        <SearchSelect
          id="categoryId"
          label="Category"
          required
          kind="category"
          params={{ isActive: "true" }}
          value={product?.category}
          placeholder="Choose a category"
          hint="Active categories."
          error={errors.categoryId}
        />
        <SelectField
          id="type"
          label="Type"
          required
          disabled={locked}
          value={type}
          onChange={(event) => setType(event.target.value)}
          hint={productTypeHint(type)}
          error={errors.type}
        >
          <option value="" disabled>
            Choose a type
          </option>
          {choices.types.map((value) => (
            <option key={value} value={value}>
              {productTypeLabel(value)}
            </option>
          ))}
        </SelectField>
        {type === "consumable" && (
          <SelectField
            id="measureType"
            label="Counted as"
            disabled={locked}
            value={measureType}
            onChange={(event) => setMeasureType(event.target.value)}
            hint="A pack, such as a box of bolts, gets one code for the whole box."
            error={errors.measureType}
          >
            {choices.measureTypes.map((value) => (
              <option key={value} value={value}>
                {measureTypeLabel(value)}
              </option>
            ))}
          </SelectField>
        )}
        {bulk && (
          <>
            <TextField
              id="packSize"
              label="Pack size"
              type="number"
              required
              disabled={locked}
              min={1}
              step={1}
              inputMode="numeric"
              defaultValue={product?.packSize ?? ""}
              error={errors.packSize}
            />
            <SelectField
              id="packUnit"
              label="Pack unit"
              required
              disabled={locked}
              defaultValue={product?.packUnit ?? ""}
              error={errors.packUnit}
            >
              <option value="" disabled>
                Choose a unit
              </option>
              {choices.packUnits.map((value) => (
                <option key={value} value={value}>
                  {packUnitLabel(value)}
                </option>
              ))}
            </SelectField>
          </>
        )}
        {type === "calibrated" && (
          <TextField
            id="calibrationIntervalDays"
            label="Calibration interval (days)"
            type="number"
            required
            min={1}
            max={3650}
            step={1}
            inputMode="numeric"
            defaultValue={product?.calibrationIntervalDays ?? ""}
            error={errors.calibrationIntervalDays}
          />
        )}
        <div className="sm:col-span-2">
          <TextAreaField
            id="description"
            label="Description (optional)"
            maxLength={500}
            defaultValue={product?.description ?? ""}
            error={errors.description}
          />
        </div>
        <div className="sm:col-span-2">
          <CheckboxField
            id="isActive"
            label="Active"
            defaultChecked={product?.isActive ?? true}
            hint="Stock can only be added to active products."
            error={errors.isActive}
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
          label={product ? "Save changes" : "Add product"}
          pendingLabel="Saving…"
        />
      </button>
    </form>
  );
}
