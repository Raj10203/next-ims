import type { Metadata } from "next";
import { PlaceholderPage } from "@/app/(app)/_components/placeholder-page";

export const metadata: Metadata = { title: "Roles" };

export default function RolesPage() {
  return (
    <PlaceholderPage
      title="Roles"
      description="Roles and what each one is allowed to do."
    />
  );
}
