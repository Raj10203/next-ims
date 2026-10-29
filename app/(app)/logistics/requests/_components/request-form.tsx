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
import { RequestRoute } from "../../_components/request-route";
import { RouteFields, type RouteValue } from "./route-fields";

// The limits of createStockRequestSchema in nest-ims.
const MAX_LINES = 50;
const MAX_QUANTITY = 10_000;

type Line = {
  key: number;
  product: PickerOption<"product"> | null;
  quantity: string;
  note: string;
};

export type Draft = {
  id: number;
  lines: {
    product: PickerOption<"product">;
    quantity: number;
    note: string | null;
  }[];
  note: string | null;
  neededBy: string | null;
};

// A site employee's request: both buttons save; "send" also hands it to HQ
// review. With routing (HQ: route StockRequest), HQ chooses both sites and an
// assignee, and nest-ims approves it at once, so there is no draft.
export function RequestForm({
  draft,
  initial = null,
  routing = false,
}: {
  draft?: Draft;
  initial?: PickerOption<"product"> | null;
  routing?: boolean;
}) {
  const router = useRouter();
  const [route, setRoute] = useState<RouteValue>({
    from: null,
    to: null,
    assignee: null,
  });
  const [lines, setLines] = useState<Line[]>(() =>
    draft
      ? draft.lines.map((line, key) => ({
          key,
          product: line.product,
          quantity: String(line.quantity),
          note: line.note ?? "",
        }))
      : [{ key: 0, product: initial, quantity: "", note: "" }],
  );
  const nextKey = useRef(lines.length);

  const update = (key: number, change: Partial<Line>) =>
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...change } : line)),
    );

  // nest-ims reports line errors as lines.<index>.<field>.
  const fields = [
    "lines",
    "note",
    "neededBy",
    "fromSiteId",
    "siteId",
    "assigneeId",
    ...lines.flatMap((_, index) => [
      `lines.${index}.productId`,
      `lines.${index}.quantity`,
      `lines.${index}.note`,
    ]),
  ];

  const { state, pending, onSubmit } = useApiForm(
    (form, intent) => {
      const body = {
        lines: lines.map((line) => ({
          productId: line.product?.id ?? 0,
          quantity: Number(line.quantity),
          note: line.note.trim() || null,
        })),
        note: optionalField(form, "note"),
        neededBy: optionalField(form, "neededBy"),
        submit: intent === "send",
        ...(routing && {
          fromSiteId: route.from?.id ?? null,
          siteId: route.to?.id ?? null,
          assigneeId: route.assignee?.id ?? null,
        }),
      };
      return draft
        ? callApi<{ id: number }>(`/stock-requests/${draft.id}`, {
            method: "PATCH",
            body,
          })
        : callApi<{ id: number }>("/stock-requests", { body });
    },
    {
      fields,
      refresh: !!draft,
      onSuccess(saved) {
        if (!draft) return router.push(`/logistics/requests/${saved.id}`);
        return { tone: "success", message: "Draft saved." };
      },
    },
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormMessage message={state.message} tone={state.tone} />

      {routing ? (
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium">Route</legend>
          <RouteFields
            initial={route}
            onChange={setRoute}
            fromDefault="Headquarters"
            errors={errors}
          />
        </fieldset>
      ) : (
        !draft && (
          <div className="rounded-lg bg-surface-muted p-3 text-sm">
            <p className="font-medium">Route</p>
            <RequestRoute from="Headquarters" to="Your site" />
          </div>
        )
      )}

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium">Products</legend>
        <p className="text-sm text-muted">
          Units of each product; a bulk product is counted in packs. Add a note
          to a product for anything HQ should know about it, such as a size.
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
              <div className="sm:col-span-2">
                <TextField
                  id={`line-${line.key}-note`}
                  name={`lines.${index}.note`}
                  label="Note (optional)"
                  maxLength={1000}
                  value={line.note}
                  onChange={(event) =>
                    update(line.key, { note: event.target.value })
                  }
                  error={errors[`lines.${index}.note`]}
                />
              </div>
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
                { key, product: null, quantity: "", note: "" },
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
          defaultValue={draft?.neededBy ?? ""}
          error={errors.neededBy}
        />
        <div className="sm:col-span-2">
          <TextAreaField
            id="note"
            label="Note for the request (optional)"
            maxLength={1000}
            defaultValue={draft?.note ?? ""}
            hint="What it is for, or anything the reviewers should know."
            error={errors.note}
          />
        </div>
      </div>

      {routing ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            It is approved at once and goes straight to packing at the sending
            site. Its sites and assignee can change until it is packed.
          </p>
          <button
            type="submit"
            name="intent"
            value="send"
            disabled={pending}
            className={`${submitClass} sm:w-auto`}
          >
            <SubmitLabel
              pending={pending}
              label="Create approved request"
              pendingLabel="Creating…"
            />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            A draft stays with your site, and anyone there can change it. Once
            sent, it can no longer be changed, and you become its requester:
            comments on it are sent to you.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              name="intent"
              value="send"
              disabled={pending}
              className={`${submitClass} sm:w-auto`}
            >
              <SubmitLabel
                pending={pending}
                label="Send to HQ"
                pendingLabel="Saving…"
              />
            </button>
            <button
              type="submit"
              name="intent"
              value="draft"
              disabled={pending}
              className={`${outlineClass} w-full sm:w-auto`}
            >
              Save draft
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
