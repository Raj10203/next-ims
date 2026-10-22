import type { Metadata } from "next";
import { PlaceholderPage } from "@/app/(app)/_components/placeholder-page";

export const metadata: Metadata = { title: "Audit log" };

export default function AuditPage() {
  return (
    <PlaceholderPage
      title="Audit log"
      description="Who changed what, and when."
    />
  );
}
