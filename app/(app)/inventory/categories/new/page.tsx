import type { Metadata } from "next";
import { Suspense } from "react";
import { FormMessage } from "@/components/form";
import { PageLayout } from "@/components/page-layout";
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
    <PageLayout
      back={{ href: "/inventory/categories", label: "Categories" }}
      title="Add category"
      form
    >
      <Suspense fallback={<FormSkeleton />}>
        <NewCategoryForm />
      </Suspense>
    </PageLayout>
  );
}
