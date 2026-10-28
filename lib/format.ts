const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

const dateTimeFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDate(value: string | Date) {
  return dateFormat.format(new Date(value));
}

export function formatDateTime(value: string | Date) {
  return dateTimeFormat.format(new Date(value));
}

// For API enum values the UI has no label for yet (nest-ims adds them as
// varchar values, without a release of this app).
export function humanize(value: string) {
  const words = value.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
