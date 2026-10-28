"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { callApi } from "@/lib/client-api";

export function SignOutButton({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await callApi("/auth/logout");
          router.replace("/login");
        })
      }
      className={className}
    >
      {children}
    </button>
  );
}
