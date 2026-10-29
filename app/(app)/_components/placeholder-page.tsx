import { Inbox } from "lucide-react";
import { PageLayout } from "@/components/page-layout";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <PageLayout title={title}>
      <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-4 py-12 text-center">
        <Inbox aria-hidden="true" className="size-10 text-muted" />
        <p className="mt-3 font-medium">Not built yet</p>
        <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      </div>
    </PageLayout>
  );
}
