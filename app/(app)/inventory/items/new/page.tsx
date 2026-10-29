import type { Metadata } from "next";
import { Suspense } from "react";
import { FormMessage } from "@/components/form";
import { PageLayout } from "@/components/page-layout";
import { FormSkeleton, LoadError } from "@/components/states";
import { can, getCurrentUser } from "@/lib/auth";
import { listProducts } from "@/lib/catalog";
import { pickedOption } from "@/lib/picked";
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

  // limit=1: only whether an active product exists; the picker searches.
  const [products, initial] = await Promise.all([
    listProducts({ isActive: "true", limit: "1" }),
    pickedOption("product", productId),
  ]);
  if (!products.ok) return <LoadError error={products.error} />;
  if (!products.data.total) {
    return (
      <FormMessage
        tone="info"
        message="Add an active product first: stock is added to a product."
      />
    );
  }
  return <AddStockForm initial={initial} />;
}

export default function NewStockPage({
  searchParams,
}: PageProps<"/inventory/items/new">) {
  return (
    <PageLayout
      back={{ href: "/inventory/items", label: "Items" }}
      title="Add stock"
      description="New stock arrives at headquarters. Each unit gets its own code for its sticker."
      form
    >
      <Suspense fallback={<FormSkeleton />}>
        <NewStockForm searchParams={searchParams} />
      </Suspense>
    </PageLayout>
  );
}
