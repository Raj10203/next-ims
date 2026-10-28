"use client";

import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { dangerClass } from "@/components/form";
import { callApi } from "@/lib/client-api";

export function DeleteButton({
  path,
  title,
  description,
  label = "Delete",
  redirectTo,
}: {
  path: string;
  title: string;
  description: string;
  label?: string;
  redirectTo: string;
}) {
  const router = useRouter();
  return (
    <ConfirmDialog
      label={label}
      title={title}
      description={description}
      confirmLabel="Delete"
      pendingLabel="Deleting…"
      triggerClassName={dangerClass}
      action={() => callApi(path, { method: "DELETE" })}
      onSuccess={() => router.push(redirectTo)}
    />
  );
}
