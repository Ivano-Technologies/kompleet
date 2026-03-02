import { normalizeText } from "../../application/extraction/normalize-text";

export interface VendorTemplateSample {
  vendorName: string;
  rawText: string;
}

export interface VendorTemplateCluster {
  templateKey: string;
  count: number;
}

export function clusterVendorTemplates(
  samples: VendorTemplateSample[],
): VendorTemplateCluster[] {
  const clusterMap = new Map<string, number>();

  for (const sample of samples) {
    const normalized = normalizeText(sample.rawText).toLowerCase();
    const signature = normalized
      .split("\n")
      .slice(0, 3)
      .join("|")
      .replace(/\d+/g, "#");
    const key = `${sample.vendorName.toLowerCase()}::${signature}`;
    clusterMap.set(key, (clusterMap.get(key) ?? 0) + 1);
  }

  return [...clusterMap.entries()]
    .map(([templateKey, count]) => ({ templateKey, count }))
    .sort((a, b) => b.count - a.count || a.templateKey.localeCompare(b.templateKey));
}
