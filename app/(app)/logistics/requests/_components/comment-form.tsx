"use client";

import { useState } from "react";
import {
  FormMessage,
  SubmitLabel,
  TextAreaField,
  outlineClass,
  secondaryClass,
} from "@/components/form";
import { callApi } from "@/lib/client-api";
import { useApiForm } from "@/lib/use-api-form";
import { field } from "@/lib/use-form-submit";

// A new comment, or with parentId a reply to that comment.
export function CommentForm({
  requestId,
  parentId,
  onDone,
}: {
  requestId: number;
  parentId?: number;
  onDone?: () => void;
}) {
  const id = parentId ? `reply-${parentId}` : "comment";
  const { state, pending, onSubmit } = useApiForm(
    (form) =>
      callApi(`/stock-requests/${requestId}/comments`, {
        body: { body: field(form, id).trim(), parentId: parentId ?? null },
      }),
    {
      fields: ["body"],
      onSuccess(_, form) {
        form.reset();
        onDone?.();
      },
    },
  );

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <FormMessage message={state.message} tone={state.tone} />
      <TextAreaField
        id={id}
        label={parentId ? "Reply" : "Add a comment"}
        required
        maxLength={2000}
        error={state.fieldErrors?.body}
      />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={outlineClass}>
          <SubmitLabel
            pending={pending}
            label={parentId ? "Reply" : "Comment"}
            pendingLabel="Sending…"
          />
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className={`${secondaryClass} w-auto px-4`}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function ReplyButton({
  requestId,
  parentId,
}: {
  requestId: number;
  parentId: number;
}) {
  const [open, setOpen] = useState(false);
  return open ? (
    <CommentForm
      requestId={requestId}
      parentId={parentId}
      onDone={() => setOpen(false)}
    />
  ) : (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="min-h-11 text-sm font-medium text-primary hover:underline"
    >
      Reply
    </button>
  );
}
