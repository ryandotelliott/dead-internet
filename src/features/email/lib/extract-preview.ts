import { parse } from "node-html-parser";

export default function extractPreview(html: string, maxLength = 120): string {
  const doc = parse(html);

  const normalized = doc.textContent.replace(/\s+/g, " ").trim();

  if (!normalized) return "<No content>";
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, Math.max(0, maxLength - 1)) + "…";
}
