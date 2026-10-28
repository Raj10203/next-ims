import type { Metadata } from "next";
import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { FormMessage } from "@/components/form";
import { PageHeader } from "@/components/page-header";
import { FormSkeleton, LoadError } from "@/components/states";
import { can, getCurrentUser } from "@/lib/auth";
import { productChoices } from "../_components/choices";
import { ProductForm } from "../_components/product-form";

export const metadata: Metadata = { title: "Add product" };

async function NewProductForm() {
  const actor = await getCurrentUser();
  if (!actor.ok) return <LoadError error={actor.error} />;
  if (!can(actor.data, "create", "Product")) {
    return <FormMessage message="Your role cannot add products." />;
  }
  const choices = await productChoices();
  if (!choices.ok) return <LoadError error={choices.error} />;
  if (!choices.data.categories.length) {
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
    <div className="space-y-6">
      <BackLink href="/inventory/products" label="Products" />
      <PageHeader
        title="Add product"
        description="What can be stocked. Items, each with its own code, are added to it afterwards."
      />
      <section className="max-w-3xl rounded-xl border border-border bg-surface p-5 sm:p-6">
        <Suspense fallback={<FormSkeleton />}>
          <NewProductForm />
        </Suspense>
      </section>
    </div>
  );
}
