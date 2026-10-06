import type { VerifiedClaim } from "../types";
import {
  expandVerifiedProductAliases,
  normalizeProduct,
} from "./product-grounding-core.ts";

export type VerifiedProductSpecificity =
  | "gateway"
  | "adc"
  | "family"
  | "other";

export interface VerifiedProductRecord {
  id: string;
  canonical: string;
  specificity: VerifiedProductSpecificity;
  aliases: string[];
}

export interface VerifiedProductCatalog {
  records: VerifiedProductRecord[];
  aliasToRecordId: Map<string, string>;
  allAliases: Set<string>;
}

function classifyProductSpecificity(normalized: string): VerifiedProductSpecificity {
  if (/netscaler[_\s-]*gateway|\bgateway\b/.test(normalized) && /netscaler/.test(normalized)) {
    return "gateway";
  }

  if (
    /application[_\s-]*delivery[_\s-]*controller|\badc\b/.test(normalized)
  ) {
    return "adc";
  }

  if (/netscaler/.test(normalized)) {
    return "family";
  }

  return "other";
}

function deriveCanonicalLabel(rawProduct: string): string {
  const normalized = normalizeProduct(rawProduct).replace(/_/g, " ");
  return normalized
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
    .replace(/\bAdc\b/g, "ADC");
}

function recordKey(specificity: VerifiedProductSpecificity, canonical: string): string {
  return `${specificity}:${normalizeProduct(canonical)}`;
}

function upsertRecord(
  catalog: VerifiedProductCatalog,
  rawProduct: string,
): void {
  const canonical = deriveCanonicalLabel(rawProduct);
  const specificity = classifyProductSpecificity(normalizeProduct(rawProduct));
  const key = recordKey(specificity, canonical);

  let record = catalog.records.find((entry) => entry.id === key);
  if (!record) {
    record = {
      id: key,
      canonical,
      specificity,
      aliases: [],
    };
    catalog.records.push(record);
  }

  const aliasSet = new Set(record.aliases);
  for (const alias of expandVerifiedProductAliases(rawProduct)) {
    aliasSet.add(alias);
    catalog.allAliases.add(alias);
    catalog.aliasToRecordId.set(alias, record.id);
  }

  record.aliases = [...aliasSet];
}

function parseAffectedProductClaimStatement(statement: string): string[] {
  const products: string[] = [];

  const productMatch = statement.match(/affected product as ([^.]+)\./i);
  if (productMatch?.[1]) {
    products.push(productMatch[1]);
  }

  const includesMatch = statement.match(/including ([^.]+)\./i);
  if (includesMatch?.[1]) {
    for (const part of includesMatch[1].split(/[;,]/)) {
      if (part.trim()) {
        products.push(part.trim());
      }
    }
  }

  return products;
}

export function buildVerifiedProductCatalog(
  claims: VerifiedClaim[],
): VerifiedProductCatalog {
  const catalog: VerifiedProductCatalog = {
    records: [],
    aliasToRecordId: new Map<string, string>(),
    allAliases: new Set<string>(),
  };

  for (const claim of claims) {
    if (claim.type !== "affected_product") {
      continue;
    }

    for (const rawProduct of parseAffectedProductClaimStatement(claim.statement)) {
      upsertRecord(catalog, rawProduct);
    }
  }

  return catalog;
}

export function catalogMatchesProductPhrase(
  phrase: string,
  catalog: VerifiedProductCatalog,
): boolean {
  const normalized = normalizeProduct(phrase);
  if (!normalized) {
    return false;
  }

  if (catalog.allAliases.has(normalized)) {
    return true;
  }

  const withCitrix = normalized.startsWith("citrix ")
    ? normalized
    : `citrix ${normalized}`;
  const withoutCitrix = normalized.startsWith("citrix ")
    ? normalized.slice("citrix ".length)
    : normalized;

  return (
    catalog.allAliases.has(withCitrix) ||
    catalog.allAliases.has(withoutCitrix)
  );
}

export function findVerifiedAliasMentionsInText(
  text: string,
  catalog: VerifiedProductCatalog,
): string[] {
  if (catalog.allAliases.size === 0) {
    return [];
  }

  const normalizedText = normalizeProduct(text);
  const aliases = [...catalog.allAliases].sort(
    (left, right) => right.length - left.length,
  );
  const matches: string[] = [];
  const occupied = new Array<number>(normalizedText.length).fill(0);

  for (const alias of aliases) {
    let searchFrom = 0;
    while (searchFrom < normalizedText.length) {
      const index = normalizedText.indexOf(alias, searchFrom);
      if (index === -1) {
        break;
      }

      const end = index + alias.length;
      const overlaps = occupied.slice(index, end).some((value) => value === 1);
      if (!overlaps) {
        for (let i = index; i < end; i += 1) {
          occupied[i] = 1;
        }
        matches.push(alias);
      }

      searchFrom = index + 1;
    }
  }

  return matches;
}

export function serializeVerifiedProductsForPrompt(
  catalog: VerifiedProductCatalog,
): Array<{ canonical: string; aliases: string[] }> {
  return catalog.records.map((record) => ({
    canonical: record.canonical,
    aliases: [...record.aliases].sort((left, right) => right.length - left.length),
  }));
}
