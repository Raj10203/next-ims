"use client";

import { useId, useRef } from "react";
import { FormMessage, SubmitLabel, outlineClass } from "@/components/form";
import type { ApiResult } from "@/lib/api-result";
import { useApiForm } from "@/lib/use-api-form";

// Without onSuccess, success reloads the page's data; with it, the caller
// navigates instead.
export function ConfirmDialog({
  label,
  title,
  description,
  confirmLabel,
  pendingLabel,
  triggerClassName,
  action,
  onSuccess,
}: {
  label: React.ReactNode;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  triggerClassName: string;
  action: () => Promise<ApiResult<unknown>>;
  onSuccess?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { state, setState, pending, onSubmit } = useApiForm(action, {
    refresh: !onSuccess,
    onSuccess() {
      dialog.current?.close();
      onSuccess?.();
    },
  });

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          setState({});
          dialog.current?.showModal();
        }}
        className={triggerClassName}
      >
        {label}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target === event.currentTarget && !pending) {
            dialog.current?.close();
          }
        }}
        className="m-auto w-full max-w-md rounded-xl border border-border bg-surface p-0 text-foreground backdrop:bg-black/50"
      >
        <form onSubmit={onSubmit} className="space-y-4 p-5">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <div className="text-sm text-muted">{description}</div>
          <FormMessage message={state.message} tone={state.tone} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={pending}
              onClick={() => dialog.current?.close()}
              className={outlineClass}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-danger px-4 text-sm font-medium text-danger-foreground hover:bg-danger/90 disabled:opacity-60"
            >
              <SubmitLabel
                pending={pending}
                label={confirmLabel}
                pendingLabel={pendingLabel}
              />
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
