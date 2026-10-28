"use client";

import { Check, ChevronsUpDown, LoaderCircle, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  FieldError,
  FieldText,
  describedBy,
  inputClass,
  outlineClass,
} from "@/components/form";
import { callApi } from "@/lib/client-api";
import {
  MIN_SEARCH,
  PICKER_LIMIT,
  pickerSources,
  toPickerOption,
  type PickerKind,
  type PickerOption,
  type PickerRecord,
} from "@/lib/pickers";
import { toSearch, type Page } from "@/lib/query";

type Results<K extends PickerKind> =
  | { status: "idle" | "short" | "loading" }
  | { status: "error"; message: string }
  | { status: "done"; options: PickerOption<K>[]; total: number };

// A select whose options come from a nest-ims search, for lists too long to
// load whole. The API is called only when the user presses Enter (or the
// search button) with at least MIN_SEARCH characters, never while typing.
// The chosen id travels in a plain input named `name`, so GET filter forms
// and FormData read it like a <select>.
export function SearchSelect<K extends PickerKind>({
  id,
  label,
  name = id,
  hint,
  error,
  required,
  kind,
  params,
  value = null,
  emptyLabel,
  placeholder = "Choose…",
  onSelect,
}: {
  id: string;
  label: string;
  name?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  kind: K;
  // Fixed filters sent with every search, such as { isActive: "true" }.
  params?: Record<string, string>;
  value?: PickerOption<K> | null;
  // The "no choice" option, such as "All products"; leave out when required.
  emptyLabel?: string;
  placeholder?: string;
  onSelect?: (option: PickerOption<K> | null) => void;
}) {
  const source = pickerSources[kind];
  const [selected, setSelected] = useState(value);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [searched, setSearched] = useState<string | null>(null);
  const [results, setResults] = useState<Results<K>>({ status: "idle" });
  const [active, setActive] = useState(-1);
  const request = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const panelId = useId();
  const listId = useId();
  const statusId = useId();

  // Before a search the list holds the current choice, so it stays visible.
  const options: (PickerOption<K> | null)[] = [
    ...(emptyLabel ? [null] : []),
    ...(results.status === "done"
      ? results.options
      : selected
        ? [selected]
        : []),
  ];

  useEffect(() => {
    if (!open) return;
    searchInput.current?.focus();
    // Touch browsers do not always blur the input on a tap elsewhere.
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  async function search(term: string) {
    if (term.length < MIN_SEARCH) {
      setResults({ status: "short" });
      return;
    }
    const current = ++request.current;
    setSearched(term);
    setResults({ status: "loading" });
    setActive(-1);
    const result = await callApi<Page<PickerRecord<K>>>(
      source.path +
        toSearch({ ...params, search: term, limit: String(PICKER_LIMIT) }),
      { method: "GET" },
    );
    // A slower earlier search must not replace a newer one.
    if (current !== request.current) return;
    if (!result.ok) {
      setResults({ status: "error", message: result.error.message });
      return;
    }
    const found = result.data.items.map((row) => toPickerOption(kind, row));
    setResults({ status: "done", options: found, total: result.data.total });
    setActive(found.length ? (emptyLabel ? 1 : 0) : -1);
  }

  function choose(option: PickerOption<K> | null) {
    setSelected(option);
    onSelect?.(option);
    setOpen(false);
    trigger.current?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      // Inside a form, Enter would submit it.
      event.preventDefault();
      const term = text.trim();
      if (term && term !== searched) return void search(term);
      if (active >= 0 && active < options.length) choose(options[active]);
      else if (!term) setResults({ status: "short" });
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    }
  }

  const status =
    results.status === "loading"
      ? "Searching…"
      : results.status === "error"
        ? results.message
        : results.status === "done"
          ? !results.total
            ? "No matches."
            : results.total > results.options.length
              ? `The first ${results.options.length} of ${results.total}. Type more to narrow it down.`
              : `${results.total} found.`
          : `Type at least ${MIN_SEARCH} characters, then press Enter.`;

  return (
    <div
      ref={root}
      onBlur={(event) => {
        if (!root.current?.contains(event.relatedTarget as Node)) {
          setOpen(false);
        }
      }}
    >
      <FieldText id={id} label={label} hint={hint} />
      <div className="relative">
        <button
          ref={trigger}
          type="button"
          id={id}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-describedby={describedBy(id, error, hint)}
          onClick={() => setOpen((isOpen) => !isOpen)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
            }
          }}
          className={`${inputClass} flex items-center justify-between gap-2 text-left ${error ? "border-danger!" : ""}`}
        >
          <span className={`truncate ${selected ? "" : "text-muted"}`}>
            {selected?.label ?? emptyLabel ?? placeholder}
          </span>
          <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0" />
        </button>
        {/* Holds the value for the form, and lets the browser's own required
            check point at the field. */}
        <input
          name={name}
          value={selected ? String(selected.id) : ""}
          onChange={() => {}}
          onFocus={() => trigger.current?.focus()}
          required={required}
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-0"
        />
        {open && (
          <div
            id={panelId}
            className="absolute inset-x-0 z-20 mt-1 rounded-lg border border-border bg-surface p-2 shadow-lg"
          >
            <div className="flex gap-2">
              <input
                ref={searchInput}
                type="search"
                role="combobox"
                aria-label={`Search ${source.noun}`}
                aria-expanded="true"
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={
                  active >= 0 ? `${listId}-${active}` : undefined
                }
                aria-describedby={statusId}
                enterKeyHint="search"
                autoComplete="off"
                maxLength={100}
                placeholder={`Search ${source.noun}`}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={onKeyDown}
                className="block min-h-11 w-full min-w-0 rounded-lg border border-input bg-surface px-3"
              />
              <button
                type="button"
                aria-label="Search"
                disabled={results.status === "loading"}
                onClick={() => void search(text.trim())}
                className={`${outlineClass} w-11 shrink-0 px-0`}
              >
                {results.status === "loading" ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <Search aria-hidden="true" className="size-4" />
                )}
              </button>
            </div>
            <p
              id={statusId}
              role="status"
              className={`px-1 pt-2 text-sm ${
                results.status === "error" || results.status === "short"
                  ? "text-danger"
                  : "text-muted"
              }`}
            >
              {status}
            </p>
            {options.length > 0 && (
              <ul
                id={listId}
                role="listbox"
                aria-label={label}
                className="mt-1 max-h-64 overflow-y-auto"
              >
                {options.map((option, index) => {
                  const isSelected =
                    (option?.id ?? null) === (selected?.id ?? null);
                  return (
                    <li
                      key={option?.id ?? "none"}
                      id={`${listId}-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      // Keeps focus in the search box, so its blur does
                      // not close the panel before the click lands.
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => choose(option)}
                      className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 text-sm ${
                        index === active ? "bg-surface-muted" : ""
                      }`}
                    >
                      <Check
                        aria-hidden="true"
                        className={`size-4 shrink-0 text-primary ${isSelected ? "" : "invisible"}`}
                      />
                      <span className="min-w-0 truncate">
                        {option ? option.label : emptyLabel}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
