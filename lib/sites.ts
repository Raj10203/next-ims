import "server-only";
import { userFetch } from "@/lib/auth";
import { digits, toSearch, type Page, type SearchParams } from "@/lib/query";

export type SiteOption = { id: number; name: string; code: string };

// A related user, as nest-ims sends it outside the users read scope.
export type PersonSummary = {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  avatarUrl: string | null;
};

export type Site = SiteOption & {
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  // "hq" is headquarters: stock arrives there and it cannot be deleted.
  type: string;
  isActive: boolean;
  inchargeId: number | null;
  incharge: PersonSummary | null;
  createdBy: PersonSummary | null;
  createdAt: string;
};

export type SiteQuery = { page?: string; limit?: string };

export function parseSiteQuery(params: SearchParams): SiteQuery {
  return { page: digits(params.page) };
}

export function listSites(query: SiteQuery = {}) {
  return userFetch<Page<Site>>(`/sites${toSearch(query)}`);
}

export function getSite(id: string) {
  return userFetch<Site>(`/sites/${id}`);
}

export function siteAddress(site: Site) {
  return [site.address, site.city, site.state, site.pincode]
    .filter(Boolean)
    .join(", ");
}
