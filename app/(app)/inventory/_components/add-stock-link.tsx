import { Plus } from "lucide-react";
import Link from "next/link";
import { submitClass } from "@/components/form";
import { can, getCurrentUser } from "@/lib/auth";

export async function AddStockLink() {
  const actor = await getCurrentUser();
  if (!actor.ok || !can(actor.data, "create", "Item")) return null;
  return (
    <Link href="/inventory/items/new" className={`${submitClass} w-auto`}>
      <Plus aria-hidden="true" className="size-4" />
      Add stock
    </Link>
  );
}
