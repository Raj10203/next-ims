"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, use, useTransition } from "react";

// Filter and page changes navigate inside one transition, so the current rows
// stay on screen (dimmed) until the server sends the new ones.

type ListNavigation = { pending: boolean; navigate: (href: string) => void };

const ListContext = createContext<ListNavigation | null>(null);

export function ListTransition({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = (href: string) =>
    startTransition(() => router.push(href, { scroll: false }));
  return <ListContext value={{ pending, navigate }}>{children}</ListContext>;
}

export function useListNavigation(): ListNavigation {
  const router = useRouter();
  return use(ListContext) ?? { pending: false, navigate: router.push };
}

export function ListBody({ children }: { children: React.ReactNode }) {
  const { pending } = useListNavigation();
  return (
    <div aria-busy={pending} className="relative">
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 -top-2 h-0.5 overflow-hidden rounded-full bg-primary/15 transition-opacity ${pending ? "opacity-100" : "opacity-0"}`}
      >
        <div className="h-full w-2/5 animate-progress rounded-full bg-primary motion-reduce:w-full motion-reduce:animate-none" />
      </div>
      <p role="status" className="sr-only">
        {pending ? "Loading results…" : ""}
      </p>
      <div
        className={`transition-opacity duration-200 ${pending ? "pointer-events-none opacity-50" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

// A Link that navigates inside the list's transition. A modified click (new
// tab, new window) is left to the browser.
export function ListLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { navigate } = useListNavigation();
  return (
    <Link
      href={href}
      scroll={false}
      className={className}
      onClick={(event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </Link>
  );
}
