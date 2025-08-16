export interface TrendResponse {
  title: string;
  subtitle: string;
  bullets: Array<{
    id: string;
    tagline: string;
  }>;
}
