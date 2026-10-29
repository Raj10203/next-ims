import type { Metadata } from "next";
import { Suspense } from "react";
import { FormMessage } from "@/components/form";
import { PageLayout } from "@/components/page-layout";
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
  const routing = can(actor.data, "route", "StockRequest");
  if (!routing && !can(actor.data, "create", "StockRequest")) {
    return (
      <FormMessage message="Stock requests are raised by site employees, for their own site." />
    );
  }
  return (
    <RequestForm
      routing={routing}
      initial={await pickedOption("product", productId)}
    />
  );
}

export default function NewRequestPage({
  searchParams,
}: PageProps<"/logistics/requests/new">) {
  return (
    <PageLayout
      back={{ href: "/logistics/requests", label: "Stock requests" }}
      title="New stock request"
      description="A site asks headquarters for stock: HQ reviews it, then a manager approves it, and either may change the quantities. HQ staff send stock between any two sites, approved at once."
      form
    >
      <Suspense fallback={<FormSkeleton />}>
        <NewRequestForm searchParams={searchParams} />
      </Suspense>
    </PageLayout>
  );
}
