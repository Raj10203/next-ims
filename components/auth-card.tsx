import { Logo } from "@/components/logo";

export function AuthCard({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo className="h-12 max-w-48" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        {children}
      </div>

      {footer && <div className="text-center text-sm text-muted">{footer}</div>}
    </div>
  );
}
