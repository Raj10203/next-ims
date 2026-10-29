import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FilterForm } from "@/components/filter-form";
import { SelectField, submitClass } from "@/components/form";
import { ListBody, ListTransition } from "@/components/list-transition";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { SearchSelect } from "@/components/search-select";
import { EmptyState, ListSkeleton, LoadError } from "@/components/states";
import { can, getCurrentUser } from "@/lib/auth";
import { pickedOption } from "@/lib/picked";
import { isFiltered } from "@/lib/query";
import { requestStatusLabel, requestStatuses } from "@/lib/request-labels";
import { listRequests, parseRequestQuery } from "@/lib/stock-requests";
import { RequestList } from "../_components/request-list";

export const metadata: Metadata = { title: "Stock requests" };

const path = "/logistics/requests";

async function NewRequestLink() {
  const actor = await getCurrentUser();
  if (!actor.ok || !can(actor.data, "create", "StockRequest")) return null;
  return (
    <Link href={`${path}/new`} className={`${submitClass} w-auto`}>
      <Plus aria-hidden="true" className="size-4" />
      New request
    </Link>
  );
}

async function Requests({
  searchParams,
}: {
  searchParams: PageProps<"/logistics/requests">["searchParams"];
}) {
  const query = parseRequestQuery(await searchParams);
  const actor = await getCurrentUser();
  if (!actor.ok) return <LoadError error={actor.error} />;
  // Site roles only ever see their own site's requests (nest-ims scopes
  // them), so the site filter is for HQ.
  const [result, site] = await Promise.all([
    listRequests(query),
    can(actor.data, "read", "Site")
      ? pickedOption("site", query.siteId)
      : undefined,
  ]);

  return (
    <ListTransition>
      <div className="space-y-4">
        <FilterForm action={path} query={query}>
          <SelectField
            id="status"
            label="Status"
            defaultValue={query.status ?? ""}
          >
            <option value="">All statuses</option>
            {requestStatuses.map((status) => (
              <option key={status} value={status}>
                {requestStatusLabel(status)}
              </option>
            ))}
          </SelectField>
          {site !== undefined && (
            <SearchSelect
              id="siteId"
              label="Site"
              kind="site"
              value={site}
              emptyLabel="All sites"
            />
          )}
          <SelectField
            id="mine"
            label="Raised by"
            defaultValue={query.mine ?? ""}
          >
            <option value="">Anyone</option>
            <option value="true">Me</option>
          </SelectField>
        </FilterForm>
        <ListBody>
          {!result.ok ? (
            <LoadError error={result.error} />
          ) : !result.data.items.length ? (
            isFiltered(query) || query.page ? (
              <EmptyState
                title="No requests match these filters"
                description="Try other filters or clear them."
              />
            ) : (
              <EmptyState
                title="No stock requests yet"
                description="Sites ask headquarters for stock here; each request goes through HQ review and a manager's approval."
              />
            )
          ) : (
            <>
              <RequestList rows={result.data.items} />
              <Pagination path={path} query={query} {...result.data} />
            </>
          )}
        </ListBody>
      </div>
    </ListTransition>
  );
}

export default function RequestsPage({
  searchParams,
}: PageProps<"/logistics/requests">) {
  return (
    <div className="space-y-6">
      <PageHeader title="Stock requests">
        <Suspense>
          <NewRequestLink />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<ListSkeleton />}>
        <Requests searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
