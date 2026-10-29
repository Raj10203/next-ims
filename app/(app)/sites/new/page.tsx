import type { Metadata } from "next";
import { Suspense } from "react";
import { FormMessage } from "@/components/form";
import { PageLayout } from "@/components/page-layout";
import { FormSkeleton, LoadError } from "@/components/states";
import { can, getCurrentUser } from "@/lib/auth";
import { inchargePicker } from "../_components/incharge-options";
import { SiteForm } from "../_components/site-form";

export const metadata: Metadata = { title: "Add site" };

async function NewSiteForm() {
  const actor = await getCurrentUser();
  if (!actor.ok) return <LoadError error={actor.error} />;
  if (!can(actor.data, "create", "Site")) {
    return <FormMessage message="Your role cannot add sites." />;
  }
  return <SiteForm incharges={await inchargePicker(actor.data)} />;
}

export default function NewSitePage() {
  return (
    <PageLayout back={{ href: "/sites", label: "Sites" }} title="Add site" form>
      <Suspense fallback={<FormSkeleton />}>
        <NewSiteForm />
      </Suspense>
    </PageLayout>
  );
}
