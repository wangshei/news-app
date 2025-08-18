export interface CategoryMeta {
  id: string;          // "society"
  label: string;       // "社会"
  color: string;       // Tailwind color class e.g. "bg-rose-500"
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "society",  label: "社会",  color: "bg-rose-500" },
  { id: "tech",     label: "科技",  color: "bg-sky-500" },
  { id: "economy",  label: "经济",  color: "bg-amber-500" },
  { id: "politics", label: "政治",  color: "bg-purple-500" },
  { id: "world",    label: "国际",  color: "bg-indigo-500" },
  { id: "culture",  label: "文化",  color: "bg-yellow-500" },
  { id: "sports",   label: "体育",  color: "bg-orange-500" },
  { id: "life",     label: "生活",  color: "bg-pink-500" },
  // feel free to add more later
];
