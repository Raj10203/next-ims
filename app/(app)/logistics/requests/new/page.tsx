import type { Metadata } from "next";
import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { FormMessage } from "@/components/form";
import { PageHeader } from "@/components/page-header";
import { FormSkeleton, LoadError } from "@/components/states";
import { can, getCurrentUser } from "@/lib/auth";
import { pickedOption } from "@/lib/picked";
import { digits } from "@/lib/query";
import { RequestForm } from "../_components/request-form";

export const metadata: Metadata = { title: "New stock request" };

async function NewRequestForm({
  searchParams,
}: {
  searchParams: PageProps<"/logistics/requests/new">["searchParams"];
}) {
  const productId = digits((await searchParams).productId);
  const actor = await getCurrentUser();
  if (!actor.ok) return <LoadError error={actor.error} />;
  if (!can(actor.data, "create", "StockRequest")) {
    return (
      <FormMessage message="Stock requests are raised by site in-charges." />
    );
  }
  return <RequestForm initial={await pickedOption("product", productId)} />;
}

export default function NewRequestPage({
  searchParams,
}: PageProps<"/logistics/requests/new">) {
  return (
    <div className="space-y-6">
      <BackLink href="/logistics/requests" label="Stock requests" />
      <PageHeader
        title="New stock request"
        description="For your site. Headquarters reviews it first, then a manager approves it; either may change the quantities."
      />
      <section className="max-w-3xl rounded-xl border border-border bg-surface p-5 sm:p-6">
        <Suspense fallback={<FormSkeleton />}>
          <NewRequestForm searchParams={searchParams} />
        </Suspense>
      </section>
    </div>
  );
}
