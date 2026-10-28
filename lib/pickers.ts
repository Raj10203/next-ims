import type { Product } from "@/lib/catalog";

// Shared by server code and the browser: what each search picker lists and
// how a record reads in it. Server code labels a preselected id with the same
// function (lib/picked.ts), so the label does not change once a search runs.

export const MIN_SEARCH = 3;
export const PICKER_LIMIT = 20;

type Named = { id: number; name: string };
type Person = {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email?: string;
};

const personName = (user: Person) =>
  [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ");

export const pickerSources = {
  product: {
    path: "/products",
    noun: "products",
    label: (
      product: Named &
        Pick<
          Product,
          "prefix" | "type" | "measureType" | "packSize" | "packUnit"
        >,
    ) => `${product.name} (${product.prefix})`,
  },
  category: {
    path: "/categories",
    noun: "categories",
    label: (category: Named) => category.name,
  },
  site: {
    path: "/sites",
    noun: "sites",
    label: (site: Named & { code?: string }) =>
      site.code ? `${site.name} (${site.code})` : site.name,
  },
  // A related user is only a summary without the email (depth one in nest-ims).
  user: {
    path: "/users",
    noun: "users",
    label: (user: Person) =>
      user.email ? `${personName(user)} (${user.email})` : personName(user),
  },
};

export type PickerKind = keyof typeof pickerSources;

export type PickerRecord<K extends PickerKind> = Parameters<
  (typeof pickerSources)[K]["label"]
>[0];

// record is the API's own row, for forms that need more than the label (the
// add stock form reads the product's type).
export type PickerOption<K extends PickerKind = PickerKind> = {
  id: number;
  label: string;
  record?: PickerRecord<K>;
};

export function toPickerOption<K extends PickerKind>(
  kind: K,
  record: PickerRecord<K>,
): PickerOption<K> {
  const label = pickerSources[kind].label as (row: PickerRecord<K>) => string;
  return { id: record.id, label: label(record), record };
}
