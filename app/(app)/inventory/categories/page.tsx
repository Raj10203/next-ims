import type { Metadata } from "next";
import { PlaceholderPage } from "@/app/(app)/_components/placeholder-page";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <PlaceholderPage
      title="Categories"
      description="Groups such as Fasteners, Power Tools and Safety, used to filter products."
    />
  );
}
