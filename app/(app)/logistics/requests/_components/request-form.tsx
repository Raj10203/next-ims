"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  FieldError,
  FormMessage,
  SubmitLabel,
  TextAreaField,
  TextField,
  outlineClass,
  submitClass,
} from "@/components/form";
import { SearchSelect } from "@/components/search-select";
import { callApi } from "@/lib/client-api";
import type { PickerOption } from "@/lib/pickers";
import { useApiForm } from "@/lib/use-api-form";
import { optionalField } from "@/lib/use-form-submit";

// The limits of createStockRequestSchema in nest-ims.
const MAX_LINES = 50;
const MAX_QUANTITY = 10_000;

type Line = {
  key: number;
  product: PickerOption<"product"> | null;
  quantity: string;
};

export function RequestForm({
  initial,
}: {
  initial: PickerOption<"product"> | null;
}) {
  const router = useRouter();
  const nextKey = useRef(1);
  const [lines, setLines] = useState<Line[]>([
    { key: 0, product: initial, quantity: "" },
  ]);

  const update = (key: number, change: Partial<Line>) =>
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...change } : line)),
    );

  // nest-ims reports line errors as lines.<index>.<field>.
  const fields = [
    "lines",
    "note",
    "neededBy",
    ...lines.flatMap((_, index) => [
      `lines.${index}.productId`,
      `lines.${index}.quantity`,
    ]),
  ];

  const { state, pending, onSubmit } = useApiForm(
    (form) =>
      callApi<{ id: number }>("/stock-requests", {
        body: {
          lines: lines.map((line) => ({
            productId: line.product?.id ?? 0,
            quantity: Number(line.quantity),
          })),
          note: optionalField(form, "note"),
          neededBy: optionalField(form, "neededBy"),
        },
      }),
    {
      fields,
      refresh: false,
      onSuccess: (saved) => router.push(`/logistics/requests/${saved.id}`),
    },
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormMessage message={state.message} tone={state.tone} />

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium">Products</legend>
        <p className="text-sm text-muted">
          Units of each product; a bulk product is counted in packs.
        </p>
        <ol className="space-y-4">
          {lines.map((line, index) => (
            <li
              key={line.key}
              className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_9rem_auto] sm:items-start"
            >
              <SearchSelect
                id={`line-${line.key}-product`}
                name={`lines.${index}.productId`}
                label={`Product ${index + 1}`}
                required
                kind="product"
                params={{ isActive: "true" }}
                value={line.product}
                placeholder="Choose a product"
                onSelect={(product) => update(line.key, { product })}
                error={errors[`lines.${index}.productId`]}
              />
              <TextField
                id={`line-${line.key}-quantity`}
                name={`lines.${index}.quantity`}
                label="Quantity"
                type="number"
                required
                min={1}
                max={MAX_QUANTITY}
                step={1}
                inputMode="numeric"
                value={line.quantity}
                onChange={(event) =>
                  update(line.key, { quantity: event.target.value })
                }
                error={errors[`lines.${index}.quantity`]}
              />
              <button
                type="button"
                disabled={lines.length === 1}
                aria-label={`Remove product ${index + 1}`}
                onClick={() =>
                  setLines((current) =>
                    current.filter((other) => other.key !== line.key),
                  )
                }
                className={`${outlineClass} w-11 px-0 sm:mt-7`}
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </li>
          ))}
        </ol>
        <FieldError id="lines-error" message={errors.lines} />
        {lines.length < MAX_LINES && (
          <button
            type="button"
            onClick={() => {
              // Outside the updater, which React may run twice.
              const key = nextKey.current++;
              setLines((current) => [
                ...current,
                { key, product: null, quantity: "" },
              ]);
            }}
            className={`${outlineClass} w-full sm:w-auto`}
          >
            <Plus aria-hidden="true" className="size-4" />
            Add product
          </button>
        )}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="neededBy"
          label="Needed by (optional)"
          type="date"
          error={errors.neededBy}
        />
        <div className="sm:col-span-2">
          <TextAreaField
            id="note"
            label="Note (optional)"
            maxLength={1000}
            hint="What it is for, or anything the reviewers should know."
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
          label="Send for review"
          pendingLabel="Sending…"
        />
      </button>
    </form>
  );
}
