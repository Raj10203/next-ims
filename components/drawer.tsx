"use client";

import { X } from "lucide-react";
import { useRef } from "react";

const sides = {
  left: "border-r starting:open:-translate-x-full",
  right: "ml-auto border-l starting:open:translate-x-full",
};

export function Drawer({
  side,
  label,
  trigger,
  triggerClassName = "",
  title,
  children,
}: {
  side: keyof typeof sides;
  label: string;
  trigger: React.ReactNode;
  triggerClassName?: string;
  title?: React.ReactNode;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
        className={`flex size-11 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground ${triggerClassName}`}
      >
        {trigger}
      </button>
      {/* A backdrop click targets the <dialog> itself; a link click closes
          it so client-side navigation does not leave it open. */}
      <dialog
        ref={dialog}
        aria-label={label}
        onClick={(event) => {
          const target = event.target as Element;
          if (target === event.currentTarget || target.closest("a")) {
            dialog.current?.close();
          }
        }}
        className={`m-0 h-dvh max-h-dvh w-80 max-w-[85vw] border-border bg-surface p-0 text-foreground transition-transform duration-200 backdrop:bg-black/50 motion-reduce:transition-none ${sides[side]}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-2 p-2 pl-3">
            {title ?? <span />}
            <button
              type="button"
              aria-label="Close"
              onClick={() => dialog.current?.close()}
              className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {children}
          </div>
        </div>
      </dialog>
    </>
  );
}
