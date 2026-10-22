import type { Metadata } from "next";
import { PlaceholderPage } from "@/app/(app)/_components/placeholder-page";

export const metadata: Metadata = { title: "My profile" };

export default function ProfilePage() {
  return (
    <PlaceholderPage
      title="My profile"
      description="Your name, photo, password and sign-in code settings."
    />
  );
}
