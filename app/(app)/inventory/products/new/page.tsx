import type { Metadata } from "next";
import { Suspense } from "react";
import { FormMessage } from "@/components/form";
import { PageLayout } from "@/components/page-layout";
import { FormSkeleton, LoadError } from "@/components/states";
import { can, getCurrentUser } from "@/lib/auth";
import { getProductOptions, listCategories } from "@/lib/catalog";
import { ProductForm } from "../_components/product-form";

export const metadata: Metadata = { title: "Add product" };

async function NewProductForm() {
  const actor = await getCurrentUser();
  if (!actor.ok) return <LoadError error={actor.error} />;
  if (!can(actor.data, "create", "Product")) {
    return <FormMessage message="Your role cannot add products." />;
  }
  // limit=1: only whether an active category exists; the picker searches.
  const [choices, categories] = await Promise.all([
    getProductOptions(),
    listCategories({ isActive: "true", limit: "1" }),
  ]);
  if (!choices.ok) return <LoadError error={choices.error} />;
  if (!categories.ok) return <LoadError error={categories.error} />;
  if (!categories.data.total) {
    return (
      <FormMessage
        tone="info"
        message="Add an active category first: every product belongs to one."
      />
    );
  }
  return <ProductForm choices={choices.data} />;
}

export default function NewProductPage() {
  return (
    <PageLayout
      back={{ href: "/inventory/products", label: "Products" }}
      title="Add product"
      description="What can be stocked. Items, each with its own code, are added to it afterwards."
      form
    >
      <Suspense fallback={<FormSkeleton />}>
        <NewProductForm />
      </Suspense>
    </PageLayout>
  );
}
