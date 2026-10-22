import type { Metadata } from "next";
import { PlaceholderPage } from "@/app/(app)/_components/placeholder-page";

export const metadata: Metadata = { title: "Sites" };

export default function SitesPage() {
  return (
    <PlaceholderPage
      title="Sites"
      description="Headquarters and every site, with the person in charge of each."
    />
  );
}
