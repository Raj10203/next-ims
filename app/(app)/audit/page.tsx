import type { Metadata } from "next";
import { Suspense } from "react";
import { FilterForm } from "@/components/filter-form";
import { ListBody, ListTransition } from "@/components/list-transition";
import { SelectField, TextField } from "@/components/form";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState, ListSkeleton, LoadError } from "@/components/states";
import {
  auditActions,
  auditEntityTypes,
  listAuditLogs,
  parseAuditQuery,
} from "@/lib/audit";
import { humanize } from "@/lib/format";
import { isFiltered } from "@/lib/query";
import { AuditEntry } from "./_components/audit-entry";

export const metadata: Metadata = { title: "Audit log" };

async function AuditList({
  searchParams,
}: {
  searchParams: PageProps<"/audit">["searchParams"];
}) {
  const query = parseAuditQuery(await searchParams);
  const result = await listAuditLogs(query);
  const types =
    query.entityType && !auditEntityTypes.includes(query.entityType)
      ? [...auditEntityTypes, query.entityType]
      : auditEntityTypes;

  return (
    <ListTransition>
      <div className="space-y-4">
        <FilterForm action="/audit" query={query}>
          <SelectField
            id="entityType"
            label="Record type"
            defaultValue={query.entityType ?? ""}
          >
            <option value="">All types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </SelectField>
          <TextField
            id="entityId"
            label="Record id"
            maxLength={64}
            defaultValue={query.entityId}
          />
          <SelectField
            id="action"
            label="Change"
            defaultValue={query.action ?? ""}
          >
            <option value="">All changes</option>
            {auditActions.map((action) => (
              <option key={action} value={action}>
                {humanize(action)}
              </option>
            ))}
          </SelectField>
          <TextField
            id="actorId"
            label="By user id"
            inputMode="numeric"
            pattern="[0-9]*"
            defaultValue={query.actorId}
          />
        </FilterForm>
        <ListBody>
          {!result.ok ? (
            <LoadError error={result.error} />
          ) : !result.data.items.length ? (
            <EmptyState
              title={
                isFiltered(query) || query.page
                  ? "No changes match these filters"
                  : "No changes recorded yet"
              }
            />
          ) : (
            <>
              <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
                {result.data.items.map((log) => (
                  <AuditEntry key={log.id} log={log} />
                ))}
              </ul>
              <Pagination path="/audit" query={query} {...result.data} />
            </>
          )}
        </ListBody>
      </div>
    </ListTransition>
  );
}

export default function AuditPage({ searchParams }: PageProps<"/audit">) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description="Who changed what, and when. Newest first."
      />
      <Suspense fallback={<ListSkeleton />}>
        <AuditList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
