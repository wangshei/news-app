import { CATEGORIES } from "@/config/categories";

const idToTextColor: Record<string, string> = CATEGORIES.reduce((acc, c) => {
  // Map to existing theme vars if you have them; otherwise derive from c.color
  // Here we simply derive a text color class from the bg color token.
  const textClass = c.color.replace(/^bg-/, 'text-');
  acc[c.id] = textClass;
  acc[c.label] = textClass; // allow label lookup too
  return acc;
}, {} as Record<string, string>);

const idToBgColor: Record<string, string> = CATEGORIES.reduce((acc, c) => {
  acc[c.id] = `${c.color}/10`;
  acc[c.label] = `${c.color}/10`;
  return acc;
}, {} as Record<string, string>);

export function getCategoryColor(idOrLabel: string): string {
  return idToTextColor[idOrLabel] ?? "text-[var(--accent)]";
}

export function getCategoryBackgroundColor(idOrLabel: string): string {
  return idToBgColor[idOrLabel] ?? "bg-[var(--accent)]/10";
}

export function getAvailableCategories(): string[] {
  return CATEGORIES.map(c => c.id);
}
