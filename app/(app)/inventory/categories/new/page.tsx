import type { Metadata } from "next";
import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { FormMessage } from "@/components/form";
import { PageHeader } from "@/components/page-header";
import { FormSkeleton, LoadError } from "@/components/states";
import { can, getCurrentUser } from "@/lib/auth";
import { CategoryForm } from "../_components/category-form";

export const metadata: Metadata = { title: "Add category" };

async function NewCategoryForm() {
  const actor = await getCurrentUser();
  if (!actor.ok) return <LoadError error={actor.error} />;
  if (!can(actor.data, "create", "Category")) {
    return <FormMessage message="Your role cannot add categories." />;
  }
  return <CategoryForm />;
}

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <BackLink href="/inventory/categories" label="Categories" />
      <PageHeader title="Add category" />
      <section className="max-w-2xl rounded-xl border border-border bg-surface p-5 sm:p-6">
        <Suspense fallback={<FormSkeleton />}>
          <NewCategoryForm />
        </Suspense>
      </section>
    </div>
  );
}
