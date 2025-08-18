export interface CategoryMeta {
  id: string;
  label: string;
  color: string;   // Tailwind bg-* class
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "society",  label: "社会",   color: "bg-[#DD4A48]"     }, // Notion Red 3
  { id: "tech",     label: "科技",   color: "bg-[#139487]"     }, // Notion GreenBlue
  { id: "economy",  label: "经济",   color: "bg-[#FFC996]"     }, // Notion Yellow
  { id: "politics", label: "政治",   color: "bg-[#583D72]"     }, // Notion Purple
  { id: "world",    label: "国际",   color: "bg-[#9F5F80]"     }, // Notion Pinkish Purple
  { id: "culture",  label: "文化",   color: "bg-[#FF8474]"     }, // Notion Orange/Red
  { id: "sports",   label: "体育",   color: "bg-[#FF5C8D]"     }, // Notion Pink
  { id: "life",     label: "生活",   color: "bg-[#D29D2B]"     }  // Notion Brown/Light

];