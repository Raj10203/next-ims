import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/states";
import { UserDirectory } from "../_components/user-directory";

export const metadata: Metadata = { title: "Invitations" };

export default function InvitationsPage({
  searchParams,
}: PageProps<"/people/invitations">) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Invitations
        </h1>
        <p className="mt-1 text-muted">
          People who have not set a password yet. Each link works for 72 hours.
        </p>
      </div>
      <Suspense fallback={<ListSkeleton />}>
        <UserDirectory
          path="/people/invitations"
          searchParams={searchParams}
          invitations
        />
      </Suspense>
    </div>
  );
}
