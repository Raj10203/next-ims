import { ArrowRight } from "lucide-react";

// Where the stock leaves from and where it goes.
export function RequestRoute({ from, to }: { from: string; to: string }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span>
        <span className="sr-only">From </span>
        {from}
      </span>
      <ArrowRight aria-hidden="true" className="size-4 text-muted" />
      <span>
        <span className="sr-only">to </span>
        {to}
      </span>
    </p>
  );
}
