import type { Metadata } from "next";
import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { FormMessage } from "@/components/form";
import { PageHeader } from "@/components/page-header";
import { FormSkeleton, LoadError } from "@/components/states";
import { can, getCurrentUser } from "@/lib/auth";
import { listProducts } from "@/lib/catalog";
import { packLabel } from "@/lib/catalog-labels";
import { digits } from "@/lib/query";
import { AddStockForm } from "../_components/add-stock-form";

export const metadata: Metadata = { title: "Add stock" };

async function NewStockForm({
  searchParams,
}: {
  searchParams: PageProps<"/inventory/items/new">["searchParams"];
}) {
  const productId = digits((await searchParams).productId);
  const actor = await getCurrentUser();
  if (!actor.ok) return <LoadError error={actor.error} />;
  if (!can(actor.data, "create", "Item")) {
    return (
      <FormMessage message="Adding stock needs the stock manager feature role." />
    );
  }

  const products = await listProducts({ isActive: "true", limit: "100" });
  if (!products.ok) return <LoadError error={products.error} />;
  if (!products.data.items.length) {
    return (
      <FormMessage
        tone="info"
        message="Add an active product first: stock is added to a product."
      />
    );
  }
  return (
    <AddStockForm
      products={products.data.items.map((product) => ({
        id: product.id,
        label: `${product.name} (${product.prefix}, ${packLabel(product).toLowerCase()})`,
        prefix: product.prefix,
        type: product.type,
      }))}
      productId={productId ? Number(productId) : undefined}
    />
  );
}

export default function NewStockPage({
  searchParams,
}: PageProps<"/inventory/items/new">) {
  return (
    <div className="space-y-6">
      <BackLink href="/inventory/items" label="Items" />
      <PageHeader
        title="Add stock"
        description="New stock arrives at headquarters. Each unit gets its own code for its sticker."
      />
      <section className="max-w-3xl rounded-xl border border-border bg-surface p-5 sm:p-6">
        <Suspense fallback={<FormSkeleton />}>
          <NewStockForm searchParams={searchParams} />
        </Suspense>
      </section>
    </div>
  );
}
