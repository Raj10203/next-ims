import type { Metadata } from "next";
import { PlaceholderPage } from "@/app/(app)/_components/placeholder-page";

export const metadata: Metadata = { title: "Users" };

export default function UsersPage() {
  return (
    <PlaceholderPage
      title="Users"
      description="Everyone who can sign in, with their role and site."
    />
  );
}
