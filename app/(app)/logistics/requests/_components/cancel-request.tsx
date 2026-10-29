"use client";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { outlineClass } from "@/components/form";
import { callApi } from "@/lib/client-api";

export function CancelRequest({ requestId }: { requestId: number }) {
  return (
    <ConfirmDialog
      label="Cancel request"
      title="Cancel this request?"
      description="Reviewers stop seeing it. To ask again, raise a new request."
      confirmLabel="Cancel request"
      pendingLabel="Cancelling…"
      triggerClassName={outlineClass}
      action={() =>
        callApi(`/stock-requests/${requestId}/cancel`, { body: {} })
      }
    />
  );
}
