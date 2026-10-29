"use client";

import {
  FormMessage,
  SubmitLabel,
  TextAreaField,
  dangerClass,
  submitClass,
} from "@/components/form";
import { callApi } from "@/lib/client-api";
import { useApiForm } from "@/lib/use-api-form";
import { field, optionalField } from "@/lib/use-form-submit";

export type DecisionLine = {
  id: number;
  product: string;
  note: string | null;
  requestedQuantity: number;
  quantity: number;
};

// MAX_REQUEST_QUANTITY in nest-ims.
const MAX_QUANTITY = 10_000;

// One form for both steps of the review chain: nest-ims applies the approval
// to whichever step is due. Only changed quantities are sent, so each change
// is recorded once.
export function DecisionForm({
  requestId,
  lines,
  finalStep,
}: {
  requestId: number;
  lines: DecisionLine[];
  finalStep: boolean;
}) {
  const { state, setState, pending, onSubmit } = useApiForm(
    (form, intent) => {
      const note = optionalField(form, "note");
      if (intent === "reject") {
        return callApi(`/stock-requests/${requestId}/reject`, {
          body: { note },
        });
      }
      const changed = lines
        .map((line) => ({
          id: line.id,
          quantity: Number(field(form, `quantity-${line.id}`)),
        }))
        .filter((change, index) => change.quantity !== lines[index].quantity);
      return callApi(`/stock-requests/${requestId}/approve`, {
        body: { lines: changed, note },
      });
    },
    { fields: ["note"] },
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form
      onSubmit={(event) => {
        const { submitter } = event.nativeEvent as SubmitEvent;
        const note = new FormData(event.currentTarget).get("note");
        // The API needs a reason to reject; say so before the round trip.
        if (
          submitter instanceof HTMLButtonElement &&
          submitter.value === "reject" &&
          !String(note ?? "").trim()
        ) {
          event.preventDefault();
          setState({
            tone: "error",
            fieldErrors: { note: "Give the reason for rejecting." },
          });
          return;
        }
        onSubmit(event);
      }}
      className="space-y-5"
    >
      <FormMessage message={state.message} tone={state.tone} />
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Product
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Asked
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Approve
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lines.map((line) => (
              <tr key={line.id}>
                <td className="px-4 py-3">
                  {line.product}
                  {line.note && (
                    <span className="block text-muted">{line.note}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {line.requestedQuantity}
                </td>
                <td className="px-4 py-2">
                  <label htmlFor={`quantity-${line.id}`} className="sr-only">
                    Quantity to approve of {line.product}
                  </label>
                  <input
                    id={`quantity-${line.id}`}
                    name={`quantity-${line.id}`}
                    type="number"
                    required
                    min={0}
                    max={MAX_QUANTITY}
                    step={1}
                    inputMode="numeric"
                    defaultValue={line.quantity}
                    className="block min-h-11 w-24 rounded-lg border border-input bg-surface px-3"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">
        0 leaves a product out. Every change is kept in the history.
      </p>
      <TextAreaField
        id="note"
        label="Note"
        maxLength={1000}
        hint="Optional when approving; the reason when rejecting."
        error={errors.note}
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          name="intent"
          value="approve"
          disabled={pending}
          className={`${submitClass} sm:w-auto`}
        >
          <SubmitLabel
            pending={pending}
            label={finalStep ? "Give final approval" : "Approve for manager"}
            pendingLabel="Saving…"
          />
        </button>
        <button
          type="submit"
          name="intent"
          value="reject"
          disabled={pending}
          className={dangerClass}
        >
          Reject
        </button>
      </div>
    </form>
  );
}
