// utils/categoryColors.ts
import { CATEGORIES } from "@/config/categories";

// Returns the Tailwind bg-* class configured for the category id or label
export function getCategoryColor(idOrLabel: string): string {
  const category = CATEGORIES.find(c => c.id === idOrLabel || c.label === idOrLabel);
  return category?.color || "bg-gray-400";
}

// Returns a lighter background variant (e.g., bg-rose-500/10)
export function getCategoryBackgroundColor(idOrLabel: string): string {
  const category = CATEGORIES.find(c => c.id === idOrLabel || c.label === idOrLabel);
  return category?.color ? `${category.color}/10` : "bg-gray-400/10";
}

// Returns the Tailwind text-* class for the category (converts bg-* to text-*)
export function getCategoryTextColor(idOrLabel: string): string {
  const category = CATEGORIES.find(c => c.id === idOrLabel || c.label === idOrLabel);
  if (!category?.textColor) return "text-gray-400";
  
  // Use the textColor field directly
  return category.textColor;
}

export function getAvailableCategories(): string[] {
  return CATEGORIES.map(c => c.id);
}
