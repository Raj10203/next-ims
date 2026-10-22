import { LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

export type ShellUser = {
  name: string;
  email: string;
  role: string;
  site: string;
};

const links = [
  { href: "/profile", label: "My profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

const row =
  "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium";

export function AccountPanel({ user }: { user: ShellUser }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-3">
        <Avatar name={user.name} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{user.name}</p>
          <p className="truncate text-sm text-muted">{user.email}</p>
          <p className="truncate text-xs text-muted">
            {user.role} · {user.site}
          </p>
        </div>
      </div>

      <ul className="space-y-1 border-t border-border pt-4">
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className={`${row} text-muted transition-colors hover:bg-surface-muted hover:text-foreground`}
            >
              <Icon aria-hidden="true" className="size-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-border px-3 pt-4">
        <span className="text-sm font-medium">Theme</span>
        <ThemeToggle />
      </div>

      <div className="border-t border-border pt-4">
        <button
          type="button"
          disabled
          title="Sign-in is not built yet"
          className={`${row} text-danger disabled:opacity-50`}
        >
          <LogOut aria-hidden="true" className="size-5" />
          Sign out
        </button>
      </div>
    </div>
  );
}
