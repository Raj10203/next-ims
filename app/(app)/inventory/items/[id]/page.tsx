import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { DeleteButton } from "@/components/delete-button";
import { ListBody, ListTransition } from "@/components/list-transition";
import { outlineClass } from "@/components/form";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { DetailList, Section } from "@/components/section";
import {
  DetailSkeleton,
  EmptyState,
  LoadError,
  NotFoundState,
} from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { historyHref } from "@/lib/audit";
import { can, fullName, getCurrentUser } from "@/lib/auth";
import {
  conditionLabel,
  itemStatusLabel,
  movementActionLabel,
  packLabel,
  productTypeLabel,
} from "@/lib/catalog-labels";
import { formatDate, formatDateTime } from "@/lib/format";
import { getItem, listMovements, type Movement } from "@/lib/items";
import { digits } from "@/lib/query";
import { ItemForm } from "../_components/item-form";

export const metadata: Metadata = { title: "Item" };

function NotFound() {
  return (
    <NotFoundState
      title="Item not found"
      href="/inventory/items"
      label="Back to items"
    />
  );
}

function conditionChange(movement: Movement) {
  const { conditionBefore: before, conditionAfter: after } = movement;
  if (after === null) return null;
  if (before === null || before === after) return `Condition ${after}%`;
  return `Condition ${before}% → ${after}%`;
}

function History({
  movements,
  path,
  page,
}: {
  movements: Awaited<ReturnType<typeof listMovements>>;
  path: string;
  page?: string;
}) {
  if (!movements.ok) return <LoadError error={movements.error} />;
  if (!movements.data.items.length) {
    return <EmptyState title="No history on this page" />;
  }
  return (
    <div className="space-y-4">
      <ol className="space-y-4 border-l-2 border-border pl-4">
        {movements.data.items.map((movement) => (
          <li key={movement.id}>
            <p className="font-medium">
              {movementActionLabel(movement.action)} at {movement.site.name}
            </p>
            <p className="text-sm text-muted">
              {formatDateTime(movement.createdAt)}
              {movement.performedBy && ` by ${fullName(movement.performedBy)}`}
            </p>
            {conditionChange(movement) && (
              <p className="mt-1 text-sm">{conditionChange(movement)}</p>
            )}
            {movement.note && (
              <p className="mt-1 text-sm wrap-break-word">{movement.note}</p>
            )}
          </li>
        ))}
      </ol>
      <Pagination path={path} query={{ page }} {...movements.data} />
    </div>
  );
}

async function ItemDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: PageProps<"/inventory/items/[id]">["searchParams"];
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return <NotFound />;
  const page = digits((await searchParams).page);

  const actor = await getCurrentUser();
  if (!actor.ok) return <LoadError error={actor.error} />;
  const [result, movements] = await Promise.all([
    getItem(id),
    listMovements(id, page),
  ]);
  if (!result.ok) {
    return result.error.statusCode === 404 ? (
      <NotFound />
    ) : (
      <LoadError error={result.error} />
    );
  }

  const item = result.data;
  const { product } = item;
  const deletable =
    can(actor.data, "delete", "Item") &&
    item.site.type === "hq" &&
    item.status === "available";

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.code}
        description={
          <Link
            href={`/inventory/products/${product.id}`}
            className="hover:underline"
          >
            {product.name}
          </Link>
        }
      >
        <StatusBadge tone="success">{itemStatusLabel(item.status)}</StatusBadge>
      </PageHeader>

      <Section id="overview" title="Overview">
        <DetailList
          rows={[
            ["Site", item.site.name],
            ["Type", productTypeLabel(product.type)],
            ["Unit", packLabel(product)],
            ["Condition", conditionLabel(item.condition)],
            ["Serial number", item.serialNumber ?? "None"],
            ...(item.nextCalibrationDueAt
              ? [
                  [
                    "Next calibration",
                    formatDate(`${item.nextCalibrationDueAt}T00:00:00`),
                  ] as [string, string],
                ]
              : []),
            ["Note", item.note ?? "None"],
            [
              "Added",
              item.createdBy
                ? `${formatDate(item.createdAt)} by ${fullName(item.createdBy)}`
                : formatDate(item.createdAt),
            ],
          ]}
        />
        {can(actor.data, "read", "AuditLog") && (
          <div className="mt-5">
            <Link
              href={historyHref("Item", item.id)}
              className={`${outlineClass} w-fit`}
            >
              Audit log
            </Link>
          </div>
        )}
      </Section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {can(actor.data, "update", "Item") && (
          <Section id="details" title="Details">
            <ItemForm
              item={{
                id: item.id,
                productType: product.type,
                serialNumber: item.serialNumber,
                condition: item.condition,
                nextCalibrationDueAt: item.nextCalibrationDueAt,
                note: item.note,
              }}
            />
          </Section>
        )}

        <Section id="history" title="History" description="Newest first.">
          <ListTransition>
            <ListBody>
              <History
                movements={movements}
                path={`/inventory/items/${item.id}`}
                page={page}
              />
            </ListBody>
          </ListTransition>
        </Section>
      </div>

      {deletable && (
        <Section
          id="delete"
          title="Delete item"
          description="Only to correct a wrong entry, while it is available at headquarters. Its history goes with it."
        >
          <DeleteButton
            path={`/items/${item.id}`}
            title={`Delete ${item.code}?`}
            description="The item and its history are removed. Its code is not reused. This cannot be undone."
            label="Delete item"
            redirectTo="/inventory/items"
          />
        </Section>
      )}
    </div>
  );
}

export default function ItemPage({
  params,
  searchParams,
}: PageProps<"/inventory/items/[id]">) {
  return (
    <div className="space-y-6">
      <BackLink href="/inventory/items" label="Items" />
      <Suspense fallback={<DetailSkeleton />}>
        <ItemDetail params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
