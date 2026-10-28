// Shared by server code and the browser.

function withNext(route: string, path: string | null) {
  return path && path !== "/"
    ? `${route}?next=${encodeURIComponent(path)}`
    : route;
}

export function loginUrl(path: string | null) {
  return withNext("/login", path);
}

export function verifyEmailUrl(path: string | null) {
  return withNext("/verify-email", path);
}

// Only paths on this site, so ?next= cannot send users elsewhere. Parsing
// like a browser catches tricks a pattern misses: browsers drop tabs and
// newlines, so "/\t/evil.example" becomes "//evil.example".
export function safeNext(value: unknown) {
  if (typeof value !== "string") return "/";
  try {
    const url = new URL(value, "http://n");
    if (url.origin === "http://n") return url.pathname + url.search + url.hash;
  } catch {}
  return "/";
}
