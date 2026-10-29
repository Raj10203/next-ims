import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { outlineClass } from "@/components/form";
import { ListBody, ListTransition } from "@/components/list-transition";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState, ListSkeleton, LoadError } from "@/components/states";
import { can, getCurrentUser } from "@/lib/auth";
import { digits } from "@/lib/query";
import { listRequests } from "@/lib/stock-requests";
import { RequestList } from "./_components/request-list";

export const metadata: Metadata = { title: "To review" };

// The caller's queue: nest-ims picks the requests waiting for their step of
// the review chain (HQ review, or the manager's approval after it).
async function Queue({
  searchParams,
}: {
  searchParams: PageProps<"/logistics">["searchParams"];
}) {
  const page = digits((await searchParams).page);
  const actor = await getCurrentUser();
  if (!actor.ok) return <LoadError error={actor.error} />;
  const result = await listRequests({ awaitingMe: "true", page });
  const review = can(actor.data, "review", "StockRequest");
  const approve = can(actor.data, "approve", "StockRequest");
  const hint =
    review && approve
      ? "New requests wait for your HQ review, and reviewed ones for your final approval. Oldest first."
      : review
        ? "New requests waiting for your HQ review, oldest first."
        : approve
          ? "Requests approved at HQ review, waiting for your final approval. Oldest first."
          : null;

  return (
    <ListTransition>
      <div className="space-y-4">
        {hint && <p className="text-sm text-muted">{hint}</p>}
        <ListBody>
          {!result.ok ? (
            <LoadError error={result.error} />
          ) : !result.data.items.length ? (
            <EmptyState
              title="Nothing waits for you"
              description="Requests appear here when they reach your step of the review."
            />
          ) : (
            <>
              <RequestList rows={result.data.items} />
              <Pagination path="/logistics" query={{ page }} {...result.data} />
            </>
          )}
        </ListBody>
      </div>
    </ListTransition>
  );
}

export default function ReviewQueuePage({
  searchParams,
}: PageProps<"/logistics">) {
  return (
    <div className="space-y-6">
      <PageHeader title="To review">
        <Link href="/logistics/requests" className={outlineClass}>
          All requests
        </Link>
      </PageHeader>
      <Suspense fallback={<ListSkeleton filters={false} />}>
        <Queue searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
