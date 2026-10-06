export function normalizeProduct(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[—–-]/g, " ")
    .replace(/\s+/g, " ");
}

const BARE_PRODUCT_SUFFIX_PATTERN =
  /^(?:adc|gateway|application delivery controller(?:\s*\(adc\))?)$/i;

export function splitAffectedProductSegments(value: string): string[] {
  const rawSegments = value
    .split(/\s*(?:,|;|\band\b)\s*/i)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const segments: string[] = [];
  let sharedVendorProductPrefix = "";

  for (const segment of rawSegments) {
    let resolvedSegment = segment;

    if (
      BARE_PRODUCT_SUFFIX_PATTERN.test(segment) &&
      sharedVendorProductPrefix
    ) {
      resolvedSegment = `${sharedVendorProductPrefix} ${segment}`;
    }

    segments.push(resolvedSegment);

    const prefixMatch = resolvedSegment.match(/^(citrix\s+netscaler)\b/i);
    if (prefixMatch?.[1]) {
      sharedVendorProductPrefix = prefixMatch[1];
    }
  }

  return segments;
}

const AFFECTED_PRODUCT_EXTRACTION_LEAD_INS: RegExp[] = [
  /^products?\s+identified\s+as\s+/i,
  /^products?\s+such\s+as\s+/i,
  /^products?\s+including\s+/i,
  /^platforms?\s+such\s+as\s+/i,
  /^systems?\s+such\s+as\s+/i,
  /^such\s+as\s+/i,
  /^including\s+/i,
  /^identified\s+as\s+/i,
  /^known\s+as\s+/i,
  /^as\s+/i,
];

const AFFECTED_PRODUCT_EXTRACTION_TRAILERS: RegExp[] = [
  /\s+for\s+active\s+(?:remediation|mitigation|patching)\.?$/i,
  /\s+under\s+active\s+(?:remediation|mitigation|patching)\.?$/i,
];

export function stripAffectedProductExtractionLeadIn(segment: string): string {
  let result = segment.trim();

  for (let pass = 0; pass < AFFECTED_PRODUCT_EXTRACTION_LEAD_INS.length; pass += 1) {
    let changed = false;
    for (const pattern of AFFECTED_PRODUCT_EXTRACTION_LEAD_INS) {
      const stripped = result.replace(pattern, "").trim();
      if (stripped !== result) {
        result = stripped;
        changed = true;
      }
    }
    if (!changed) {
      break;
    }
  }

  return result;
}

export function normalizeAffectedProductSegment(segment: string): string {
  let normalized = normalizeProduct(
    stripAffectedProductExtractionLeadIn(segment),
  );
  normalized = normalized.replace(
    /\s*\((?:adc|application delivery controller)\)/gi,
    "",
  );
  normalized = normalized.replace(/\s+(?:deployments|appliances|systems)$/i, "");
  for (const pattern of AFFECTED_PRODUCT_EXTRACTION_TRAILERS) {
    normalized = normalized.replace(pattern, "");
  }
  return normalized.trim();
}

function withOptionalCitrixPrefix(value: string): string[] {
  const normalized = normalizeProduct(value);
  if (!normalized) {
    return [];
  }

  const variants = new Set<string>([normalized]);
  if (normalized.startsWith("citrix ")) {
    variants.add(normalized.slice("citrix ".length));
  } else {
    variants.add(`citrix ${normalized}`);
  }

  return [...variants];
}

export function expandVerifiedProductAliases(rawProduct: string): string[] {
  const normalized = normalizeProduct(rawProduct);
  if (!normalized) {
    return [];
  }

  const aliases = new Set<string>();
  const add = (value: string): void => {
    for (const variant of withOptionalCitrixPrefix(value)) {
      aliases.add(variant);
    }
  };

  add(normalized);

  const spaced = normalized.replace(/_/g, " ");
  add(spaced);

  const adcSource =
    /application[_\s]delivery[_\s]controller/i.test(normalized) ||
    /application[_\s]delivery[_\s]controller/i.test(spaced);

  if (adcSource) {
    add(spaced.replace(/application delivery controller/gi, "adc"));
    add(
      normalized
        .replace(/application_delivery_controller/gi, "adc")
        .replace(/_/g, " "),
    );
    if (/netscaler/i.test(spaced)) {
      add("citrix netscaler adc");
      add("netscaler adc");
    }
  }

  const gatewaySource =
    /netscaler[_\s]gateway/i.test(normalized) ||
    /netscaler[_\s]gateway/i.test(spaced);

  if (gatewaySource) {
    add("citrix netscaler gateway");
    add("netscaler gateway");
  }

  return [...aliases];
}

export function addVerifiedAffectedProducts(
  target: Set<string>,
  rawProduct: string,
): void {
  for (const alias of expandVerifiedProductAliases(rawProduct)) {
    target.add(alias);
  }
}

function productSegmentsEquivalent(left: string, right: string): boolean {
  if (left === right) {
    return true;
  }

  const leftVariants = new Set(withOptionalCitrixPrefix(left));
  const rightVariants = new Set(withOptionalCitrixPrefix(right));

  for (const leftVariant of leftVariants) {
    if (rightVariants.has(leftVariant)) {
      return true;
    }
  }

  return false;
}

function hasVersionSpecificity(value: string): boolean {
  return /\b(?:\d{2}H\d|\d{4}(?:\s+R\d+)?|\d+\.\d+(?:\.\d+)*)\b/i.test(value);
}

export function isAffectedProductSupported(
  value: string,
  verifiedAliases: Set<string>,
): boolean {
  if (verifiedAliases.size === 0) {
    return true;
  }

  const segments = splitAffectedProductSegments(value);
  if (segments.length === 0) {
    return false;
  }

  for (const segment of segments) {
    const normalizedSegment = normalizeAffectedProductSegment(segment);
    if (!normalizedSegment) {
      return false;
    }

    if (hasVersionSpecificity(normalizedSegment)) {
      const versionMatch = [...verifiedAliases].some(
        (alias) => alias === normalizedSegment,
      );
      if (!versionMatch) {
        return false;
      }
      continue;
    }

    const segmentMatch = [...verifiedAliases].some((alias) =>
      productSegmentsEquivalent(normalizedSegment, alias),
    );
    if (!segmentMatch) {
      return false;
    }
  }

  return true;
}
