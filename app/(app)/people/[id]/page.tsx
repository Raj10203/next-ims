import type { Metadata } from "next";
import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { DetailSkeleton } from "@/components/states";
import { UserDetail } from "../_components/user-detail";

export const metadata: Metadata = { title: "User" };

export default function UserPage({ params }: PageProps<"/people/[id]">) {
  return (
    <div className="space-y-6">
      <BackLink href="/people" label="Users" />
      <Suspense fallback={<DetailSkeleton />}>
        <UserDetail params={params} />
      </Suspense>
    </div>
  );
}
