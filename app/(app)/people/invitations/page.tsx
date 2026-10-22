import type { Metadata } from "next";
import { PlaceholderPage } from "@/app/(app)/_components/placeholder-page";

export const metadata: Metadata = { title: "Invitations" };

export default function InvitationsPage() {
  return (
    <PlaceholderPage
      title="Invitations"
      description="Pending invitations and when they expire."
    />
  );
}
