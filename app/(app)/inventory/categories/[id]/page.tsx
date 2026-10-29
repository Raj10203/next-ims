import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DeleteButton } from "@/components/delete-button";
import { outlineClass } from "@/components/form";
import { PageHeader } from "@/components/page-header";
import { PageLayout } from "@/components/page-layout";
import { DetailList, Section } from "@/components/section";
import { DetailSkeleton, LoadError, NotFoundState } from "@/components/states";
import { ActiveBadge } from "@/components/status-badge";
import { historyHref } from "@/lib/audit";
import { can, fullName, getCurrentUser } from "@/lib/auth";
import { getCategory } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { CategoryForm } from "../_components/category-form";

export const metadata: Metadata = { title: "Category" };

const path = "/inventory/categories";

function NotFound() {
  return (
    <NotFoundState
      title="Category not found"
      href={path}
      label="Back to categories"
    />
  );
}

async function CategoryDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return <NotFound />;

  const actor = await getCurrentUser();
  if (!actor.ok) return <LoadError error={actor.error} />;
  const result = await getCategory(id);
  if (!result.ok) {
    return result.error.statusCode === 404 ? (
      <NotFound />
    ) : (
      <LoadError error={result.error} />
    );
  }
  const category = result.data;

  return (
    <div className="space-y-6">
      <PageHeader title={category.name}>
        <ActiveBadge active={category.isActive} />
      </PageHeader>

      <Section id="overview" title="Overview">
        <DetailList
          rows={[
            ["Description", category.description ?? "None"],
            [
              "Added",
              category.createdBy
                ? `${formatDate(category.createdAt)} by ${fullName(category.createdBy)}`
                : formatDate(category.createdAt),
            ],
          ]}
        />
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/inventory/products?categoryId=${category.id}`}
            className={outlineClass}
          >
            Products
          </Link>
          {can(actor.data, "read", "AuditLog") && (
            <Link
              href={historyHref("Category", category.id)}
              className={outlineClass}
            >
              History
            </Link>
          )}
        </div>
      </Section>

      {can(actor.data, "update", "Category") && (
        <Section id="details" title="Details">
          <CategoryForm
            category={{
              id: category.id,
              name: category.name,
              description: category.description,
              isActive: category.isActive,
            }}
          />
        </Section>
      )}

      {can(actor.data, "delete", "Category") && (
        <Section
          id="delete"
          title="Delete category"
          description="Only a category without products can be deleted. Otherwise, mark it inactive."
        >
          <DeleteButton
            path={`/categories/${category.id}`}
            title={`Delete ${category.name}?`}
            description="The category is removed. This cannot be undone."
            label="Delete category"
            redirectTo={path}
          />
        </Section>
      )}
    </div>
  );
}

export default function CategoryPage({
  params,
}: PageProps<"/inventory/categories/[id]">) {
  return (
    <PageLayout back={{ href: path, label: "Categories" }}>
      <Suspense fallback={<DetailSkeleton />}>
        <CategoryDetail params={params} />
      </Suspense>
    </PageLayout>
  );
}
