import type { Metadata } from "next";
import { PlaceholderPage } from "@/app/(app)/_components/placeholder-page";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage() {
  return (
    <PlaceholderPage
      title="Products"
      description="The product catalog: what can be stocked, with its code prefix and category."
    />
  );
}
