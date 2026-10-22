import type { Metadata } from "next";
import { PlaceholderPage } from "@/app/(app)/_components/placeholder-page";

export const metadata: Metadata = { title: "Items" };

export default function ItemsPage() {
  return (
    <PlaceholderPage
      title="Items"
      description="Every stocked item with its code, site, status and condition. Scan a barcode to find one."
    />
  );
}
