import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLayout } from "@/components/page-layout";
import { DetailSkeleton } from "@/components/states";
import { UserDetail } from "../_components/user-detail";

export const metadata: Metadata = { title: "User" };

export default function UserPage({ params }: PageProps<"/people/[id]">) {
  return (
    <PageLayout back={{ href: "/people", label: "Users" }}>
      <Suspense fallback={<DetailSkeleton />}>
        <UserDetail params={params} />
      </Suspense>
    </PageLayout>
  );
}
