"use client";

import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  FormMessage,
  SubmitLabel,
  dangerClass,
  outlineClass,
} from "@/components/form";
import { callApi } from "@/lib/client-api";
import { useApiForm } from "@/lib/use-api-form";

type Message = { message: string };

export function ResendInvitationButton({ userId }: { userId: number }) {
  const { state, pending, onSubmit } = useApiForm(
    () => callApi<Message>(`/users/${userId}/invitation`),
    { onSuccess: (data) => ({ tone: "success", message: data.message }) },
  );

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <button type="submit" disabled={pending} className={outlineClass}>
        <SubmitLabel
          pending={pending}
          label="Resend invitation"
          pendingLabel="Sending…"
        />
      </button>
      <FormMessage message={state.message} tone={state.tone} />
    </form>
  );
}

function ReactivateButton({ userId }: { userId: number }) {
  const { state, pending, onSubmit } = useApiForm(() =>
    callApi(`/users/${userId}/reactivate`),
  );

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <FormMessage message={state.message} tone={state.tone} />
      <button type="submit" disabled={pending} className={outlineClass}>
        <SubmitLabel
          pending={pending}
          label="Reactivate"
          pendingLabel="Reactivating…"
        />
      </button>
    </form>
  );
}

export function AccountActions({
  userId,
  name,
  isActive,
  activated,
  canDelete,
}: {
  userId: number;
  name: string;
  isActive: boolean;
  activated: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {isActive && !activated && (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            They have not set a password yet. A new link replaces the old one.
          </p>
          <ResendInvitationButton userId={userId} />
        </div>
      )}

      {isActive ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Deactivating signs them out everywhere and blocks sign-in until the
            account is reactivated.
          </p>
          <ConfirmDialog
            label="Deactivate"
            title={`Deactivate ${name}?`}
            description="They are signed out on every device and cannot sign in until you reactivate the account."
            confirmLabel="Deactivate"
            pendingLabel="Deactivating…"
            triggerClassName={dangerClass}
            action={() => callApi(`/users/${userId}/deactivate`)}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            {activated
              ? "They can sign in again with their password."
              : "Deactivating cancelled their invitation: resend it after reactivating."}
          </p>
          <ReactivateButton userId={userId} />
        </div>
      )}

      {canDelete && !activated && (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            They never set a password, so the account can be deleted, for
            example after a mistaken invitation.
          </p>
          <ConfirmDialog
            label="Delete user"
            title={`Delete ${name}?`}
            description="The account and its invitation are removed. This cannot be undone."
            confirmLabel="Delete"
            pendingLabel="Deleting…"
            triggerClassName={dangerClass}
            action={() => callApi(`/users/${userId}`, { method: "DELETE" })}
            onSuccess={() => router.push("/people")}
          />
        </div>
      )}
    </div>
  );
}
