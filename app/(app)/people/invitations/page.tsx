import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLayout } from "@/components/page-layout";
import { ListSkeleton } from "@/components/states";
import { UserDirectory } from "../_components/user-directory";

export const metadata: Metadata = { title: "Invitations" };

export default function InvitationsPage({
  searchParams,
}: PageProps<"/people/invitations">) {
  return (
    <PageLayout
      title="Invitations"
      description="People who have not set a password yet. Each link works for 72 hours."
    >
      <Suspense fallback={<ListSkeleton />}>
        <UserDirectory
          path="/people/invitations"
          searchParams={searchParams}
          invitations
        />
      </Suspense>
    </PageLayout>
  );
}
