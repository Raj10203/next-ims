import "server-only";
import type { ApiResult } from "@/lib/api-result";
import { getProductOptions, listCategories } from "@/lib/catalog";
import type { ProductChoices } from "./product-form";

// Active categories, plus the product's own one if it has been deactivated.
export async function productChoices(currentCategory?: {
  id: number;
  name: string;
}): Promise<ApiResult<ProductChoices>> {
  const [options, categories] = await Promise.all([
    getProductOptions(),
    listCategories({ isActive: "true", limit: "100" }),
  ]);
  if (!options.ok) return options;
  if (!categories.ok) return categories;

  const list = categories.data.items.map(({ id, name }) => ({
    id,
    label: name,
  }));
  if (
    currentCategory &&
    !list.some((category) => category.id === currentCategory.id)
  ) {
    list.unshift({ id: currentCategory.id, label: currentCategory.name });
  }
  return {
    ok: true,
    status: 200,
    data: { ...options.data, categories: list },
  };
}
