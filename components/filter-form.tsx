"use client";

import {
  SelectField,
  SubmitLabel,
  TextField,
  outlineClass,
  submitClass,
} from "@/components/form";
import { ListLink, useListNavigation } from "@/components/list-transition";
import { isFiltered, toSearch, type Query } from "@/lib/query";

// A GET form: the filters live in the URL, so they survive a reload and can
// be shared. action keeps it working as a plain form without JavaScript.
export function FilterForm({
  action,
  query,
  children,
}: {
  action: string;
  query: Query;
  children: React.ReactNode;
}) {
  const { pending, navigate } = useListNavigation();

  return (
    // The key remounts the inputs when the URL changes (Clear, back button).
    <form
      key={JSON.stringify(query)}
      action={action}
      onSubmit={(event) => {
        event.preventDefault();
        const values: Query = {};
        for (const [key, value] of new FormData(event.currentTarget)) {
          if (typeof value === "string") values[key] = value.trim();
        }
        navigate(action + toSearch(values));
      }}
      className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {children}
      <div className="flex gap-2 sm:col-span-2 lg:col-span-1 lg:col-start-4 lg:self-end">
        <button
          type="submit"
          disabled={pending}
          className={`${submitClass} flex-1`}
        >
          <SubmitLabel
            pending={pending}
            label="Filter"
            pendingLabel="Loading…"
          />
        </button>
        {isFiltered(query) && (
          <ListLink href={action} className={`${outlineClass} flex-1`}>
            Clear
          </ListLink>
        )}
      </div>
    </form>
  );
}

export function ActiveFilter({ value }: { value?: string }) {
  return (
    <SelectField id="isActive" label="Status" defaultValue={value ?? ""}>
      <option value="">All</option>
      <option value="true">Active</option>
      <option value="false">Inactive</option>
    </SelectField>
  );
}

export function SearchFilter({
  value,
  placeholder,
  maxLength,
}: {
  value?: string;
  placeholder: string;
  maxLength: number;
}) {
  return (
    <div className="sm:col-span-2">
      <TextField
        id="search"
        label="Search"
        type="search"
        placeholder={placeholder}
        maxLength={maxLength}
        defaultValue={value}
      />
    </div>
  );
}
