export interface Source {
  title: string;
  url: string;
  favicon?: string;
}

export type CategoryKey =
  | "company_info"
  | "adverse_news"
  | "risk_assessment"
  | "products_services"
  | "claims_history"


export type CategoryStatus = "pending" | "in_progress" | "completed" | "error";

export interface CategoryState {
  status: CategoryStatus;
  data: Record<string, any> | null;
  sources: Source[];
  progressMessage: string;
}

/**
 * LinkedIn enrichment is returned by the backend as a hidden supplemental
 * result for Company Information, rather than as a visible category/tab.
 */
export type CategoriesState = Record<CategoryKey, CategoryState> & {
  leadership_linkedin?: CategoryState;
};

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  company_info: "Company Information",
  adverse_news: "Adverse News",
  risk_assessment: "Risk Assessment",
  products_services: "Products & Services",
  claims_history: "Claims History",
};

export const CATEGORY_ORDER: CategoryKey[] = [
  "company_info",
  "adverse_news",
  "risk_assessment",
  "products_services",
  "claims_history",
];

export function initialCategoriesState(): CategoriesState {
  const blank = { status: "pending" as const, data: null, sources: [] as Source[], progressMessage: "" };
  const state: Partial<CategoriesState> = {};
  for (const key of CATEGORY_ORDER) {
    state[key] = { ...blank };
  }

  return state as CategoriesState;
}
