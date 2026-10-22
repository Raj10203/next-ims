import type { Metadata } from "next";
import { PlaceholderPage } from "@/app/(app)/_components/placeholder-page";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Language and other preferences."
    />
  );
}
