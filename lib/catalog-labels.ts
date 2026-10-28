import { humanize } from "@/lib/format";

const productTypes: Record<string, string> = {
  consumable: "Consumable",
  non_consumable: "Returnable",
  personal_issue: "Personal issue",
  calibrated: "Calibrated",
};

const productTypeHints: Record<string, string> = {
  consumable: "Used up, like bolts or tape.",
  non_consumable: "Returned after use; its condition is tracked.",
  personal_issue: "Given to one person, like safety shoes or a laptop.",
  calibrated: "Needs calibration at a fixed interval.",
};

const measureTypes: Record<string, string> = {
  single: "One piece per code",
  bulk: "One pack per code",
};

const packUnits: Record<string, string> = {
  pcs: "pieces",
  kg: "kg",
  g: "g",
  m: "metres",
  l: "litres",
  set: "sets",
};

const itemStatuses: Record<string, string> = { available: "Available" };

export const productTypeLabel = (value: string) =>
  productTypes[value] ?? humanize(value);

export const productTypeHint = (value: string) => productTypeHints[value];

export const measureTypeLabel = (value: string) =>
  measureTypes[value] ?? humanize(value);

export const packUnitLabel = (value: string) => packUnits[value] ?? value;

export const itemStatusLabel = (value: string) =>
  itemStatuses[value] ?? humanize(value);

export function packLabel(product: {
  measureType: string;
  packSize: number | null;
  packUnit: string | null;
}) {
  return product.measureType === "bulk" && product.packSize && product.packUnit
    ? `Pack of ${product.packSize} ${packUnitLabel(product.packUnit)}`
    : "Single piece";
}

const movementActions: Record<string, string> = {
  added: "Added",
  condition_changed: "Condition changed",
};

export const movementActionLabel = (value: string) =>
  movementActions[value] ?? humanize(value);

export const conditionLabel = (condition: number | null) =>
  condition === null ? "Not tracked" : `${condition}%`;
