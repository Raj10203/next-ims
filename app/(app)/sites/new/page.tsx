import type { Metadata } from "next";
import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { FormMessage } from "@/components/form";
import { PageHeader } from "@/components/page-header";
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
    <div className="space-y-6">
      <BackLink href="/sites" label="Sites" />
      <PageHeader title="Add site" />
      <section className="max-w-3xl rounded-xl border border-border bg-surface p-5 sm:p-6">
        <Suspense fallback={<FormSkeleton />}>
          <NewSiteForm />
        </Suspense>
      </section>
    </div>
  );
}
