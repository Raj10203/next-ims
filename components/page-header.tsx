export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight wrap-break-word sm:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}
