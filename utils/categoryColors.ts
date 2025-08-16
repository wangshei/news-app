// Category color mapping for news categories
export const categoryColors: { [key: string]: string } = {
  // API response IDs (from Eko news fetch)
  "society": "text-[var(--category-red-primary)]",
  "tech": "text-[var(--category-blue-primary)]",
  "economy": "text-[var(--category-green-primary)]",
  
  // Chinese category names
  "社会": "text-[var(--category-red-primary)]",
  "经济": "text-[var(--category-green-primary)]",
  "财经": "text-[var(--category-green-primary)]", // Alias for 经济
  "政治": "text-[var(--category-blue-dark)]",
  "国际": "text-[var(--category-purple-primary)]",
  "世界": "text-[var(--category-purple-primary)]", // Alias for 国际
  "科技": "text-[var(--category-blue-primary)]",
  "文化": "text-[var(--category-yellow-primary)]",
  "文教": "text-[var(--category-yellow-primary)]", // Alias for 文化
  "体育": "text-[var(--category-orange-primary)]",
  "娱乐": "text-[var(--category-pink-primary)]",
  "生活": "text-[var(--category-peach)]",
  "消费": "text-[var(--category-peach)]", // Alias for 生活
  "汽车": "text-[var(--category-gold)]",
  "军事": "text-[var(--category-red-secondary)]",
  "评论": "text-[var(--category-purple-secondary)]",
  "观点": "text-[var(--category-purple-secondary)]", // Alias for 评论
  
  // Fallback for unknown categories
  "default": "text-[var(--accent)]"
};

// Category background color mapping with 10% opacity
export const categoryBackgroundColors: { [key: string]: string } = {
  // API response IDs (from Eko news fetch)
  "society": "bg-[var(--category-red-primary)]/10",
  "tech": "bg-[var(--category-blue-primary)]/10",
  "economy": "bg-[var(--category-green-primary)]/10",
  
  // Chinese category names
  "社会": "bg-[var(--category-red-primary)]/10",
  "经济": "bg-[var(--category-green-primary)]/10",
  "财经": "bg-[var(--category-green-primary)]/10", // Alias for 经济
  "政治": "bg-[var(--category-blue-dark)]/10",
  "国际": "bg-[var(--category-purple-primary)]/10",
  "世界": "bg-[var(--category-purple-primary)]/10", // Alias for 国际
  "科技": "bg-[var(--category-blue-primary)]/10",
  "文化": "bg-[var(--category-yellow-primary)]/10",
  "文教": "bg-[var(--category-yellow-primary)]/10", // Alias for 文化
  "体育": "bg-[var(--category-orange-primary)]/10",
  "娱乐": "bg-[var(--category-pink-primary)]/10",
  "生活": "bg-[var(--category-peach)]/10",
  "消费": "bg-[var(--category-peach)]/10", // Alias for 生活
  "汽车": "bg-[var(--category-gold)]/10",
  "军事": "bg-[var(--category-red-secondary)]/10",
  "评论": "bg-[var(--category-purple-secondary)]/10",
  "观点": "bg-[var(--category-purple-secondary)]/10", // Alias for 评论
  
  // Fallback for unknown categories
  "default": "bg-[var(--accent)]/10"
};

// Function to get category color with fallback
export function getCategoryColor(category: string): string {
  return categoryColors[category] || categoryColors.default;
}

// Function to get category background color with fallback
export function getCategoryBackgroundColor(category: string): string {
  return categoryBackgroundColors[category] || categoryBackgroundColors.default;
}

// Function to get all available categories
export function getAvailableCategories(): string[] {
  return Object.keys(categoryColors).filter(key => key !== "default");
}
