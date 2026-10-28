import { StatusBadge } from "@/components/status-badge";
import type { UserStatus } from "@/lib/users";

const badges = {
  invited: { tone: "info", label: "Invited" },
  active: { tone: "success", label: "Active" },
  inactive: { tone: "neutral", label: "Inactive" },
} as const;

export function statusLabel(status: UserStatus) {
  return badges[status].label;
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const { tone, label } = badges[status];
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}
