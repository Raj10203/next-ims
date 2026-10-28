import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { DataList } from "@/components/data-list";
import { DeleteButton } from "@/components/delete-button";
import { outlineClass, submitClass } from "@/components/form";
import { PageHeader } from "@/components/page-header";
import { DetailList, Section } from "@/components/section";
import {
  DetailSkeleton,
  EmptyState,
  LoadError,
  NotFoundState,
} from "@/components/states";
import { ActiveBadge } from "@/components/status-badge";
import { historyHref } from "@/lib/audit";
import { can, fullName, getCurrentUser } from "@/lib/auth";
import { getProduct } from "@/lib/catalog";
import {
  itemStatusLabel,
  packLabel,
  productTypeLabel,
} from "@/lib/catalog-labels";
import { formatDate } from "@/lib/format";
import { getStock } from "@/lib/items";
import { productChoices } from "../_components/choices";
import { ProductForm } from "../_components/product-form";

export const metadata: Metadata = { title: "Product" };

const path = "/inventory/products";

function NotFound() {
  return (
    <NotFoundState
      title="Product not found"
      href={path}
      label="Back to products"
    />
  );
}

async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return <NotFound />;

  const actor = await getCurrentUser();
  if (!actor.ok) return <LoadError error={actor.error} />;
  const result = await getProduct(id);
  if (!result.ok) {
    return result.error.statusCode === 404 ? (
      <NotFound />
    ) : (
      <LoadError error={result.error} />
    );
  }

  const product = result.data;
  const update = can(actor.data, "update", "Product");
  const [stock, choices] = await Promise.all([
    can(actor.data, "read", "Item")
      ? getStock({ productId: id, limit: "100" })
      : null,
    update ? productChoices(product.category) : null,
  ]);
  const rows = stock?.ok
    ? stock.data.items.map((row) => ({
        ...row,
        id: `${row.siteId}-${row.status}`,
      }))
    : [];
  const units = rows.reduce((sum, row) => sum + row.count, 0);
  // nest-ims refuses to change the identity fields while items exist; the
  // form says so up front. Without read Item, the API's 409 says it instead.
  const locked = units > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description={`${product.prefix} · ${product.category.name}`}
      >
        <ActiveBadge active={product.isActive} />
      </PageHeader>

      <Section id="overview" title="Overview">
        <DetailList
          rows={[
            [
              "Category",
              <Link
                key="category"
                href={`/inventory/categories/${product.categoryId}`}
                className="hover:underline"
              >
                {product.category.name}
              </Link>,
            ],
            ["Type", productTypeLabel(product.type)],
            ["Unit", packLabel(product)],
            ...(product.calibrationIntervalDays
              ? [
                  [
                    "Calibration",
                    `Every ${product.calibrationIntervalDays} days`,
                  ] as [string, string],
                ]
              : []),
            ["Description", product.description ?? "None"],
            [
              "Added",
              product.createdBy
                ? `${formatDate(product.createdAt)} by ${fullName(product.createdBy)}`
                : formatDate(product.createdAt),
            ],
          ]}
        />
        {can(actor.data, "read", "AuditLog") && (
          <div className="mt-5">
            <Link
              href={historyHref("Product", product.id)}
              className={`${outlineClass} w-fit`}
            >
              History
            </Link>
          </div>
        )}
      </Section>

      {stock && (
        <Section
          id="stock"
          title="Stock"
          description={
            stock.ok ? `${units} in total, by site and status.` : undefined
          }
          action={
            <div className="flex flex-wrap gap-2">
              {units > 0 && (
                <Link
                  href={`/inventory?productId=${product.id}`}
                  className={outlineClass}
                >
                  View items
                </Link>
              )}
              {product.isActive && can(actor.data, "create", "Item") && (
                <Link
                  href={`/inventory/new?productId=${product.id}`}
                  className={`${submitClass} w-auto`}
                >
                  <Plus aria-hidden="true" className="size-4" />
                  Add stock
                </Link>
              )}
            </div>
          }
        >
          {!stock.ok ? (
            <LoadError error={stock.error} />
          ) : !rows.length ? (
            <EmptyState title="No stock" description="Nothing added yet." />
          ) : (
            <DataList
              rows={rows}
              card={(row) => ({
                title: row.siteName,
                subtitle: itemStatusLabel(row.status),
                badge: <span className="font-semibold">{row.count}</span>,
              })}
              columns={[
                { header: "Site", cell: (row) => row.siteName },
                {
                  header: "Status",
                  cell: (row) => itemStatusLabel(row.status),
                },
                { header: "Count", cell: (row) => row.count, align: "right" },
              ]}
            />
          )}
        </Section>
      )}

      {update && choices && (
        <Section id="details" title="Details">
          {choices.ok ? (
            <ProductForm
              product={{
                id: product.id,
                name: product.name,
                prefix: product.prefix,
                categoryId: product.categoryId,
                type: product.type,
                measureType: product.measureType,
                packSize: product.packSize,
                packUnit: product.packUnit,
                calibrationIntervalDays: product.calibrationIntervalDays,
                description: product.description,
                isActive: product.isActive,
              }}
              choices={choices.data}
              locked={locked}
            />
          ) : (
            <LoadError error={choices.error} />
          )}
        </Section>
      )}

      {can(actor.data, "delete", "Product") && (
        <Section
          id="delete"
          title="Delete product"
          description="Only a product without items can be deleted. Otherwise, mark it inactive."
        >
          <DeleteButton
            path={`/products/${product.id}`}
            title={`Delete ${product.name}?`}
            description="The product is removed. This cannot be undone."
            label="Delete product"
            redirectTo={path}
          />
        </Section>
      )}
    </div>
  );
}

export default function ProductPage({
  params,
}: PageProps<"/inventory/products/[id]">) {
  return (
    <div className="space-y-6">
      <BackLink href={path} label="Products" />
      <Suspense fallback={<DetailSkeleton />}>
        <ProductDetail params={params} />
      </Suspense>
    </div>
  );
}
