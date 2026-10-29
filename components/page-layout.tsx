import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";

// The frame of every screen: the same width and spacing, the way back, and
// the title with its actions. A form page is narrower and centred in a card,
// so both sides keep the same gap. Detail pages whose title comes from the
// data leave title out and render their own PageHeader.
export function PageLayout({
  title,
  description,
  actions,
  back,
  form = false,
  children,
}: {
  title?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  form?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`mx-auto w-full space-y-6 ${form ? "max-w-4xl" : ""}`}>
      {back && <BackLink href={back.href} label={back.label} />}
      {title && (
        <PageHeader title={title} description={description}>
          {actions}
        </PageHeader>
      )}
      {form ? (
        <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          {children}
        </section>
      ) : (
        children
      )}
    </div>
  );
}
