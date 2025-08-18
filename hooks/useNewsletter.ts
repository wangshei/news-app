import { useState, useEffect } from 'react';

interface Headline {
  id: string;
  title: string;
  source: string;
  url: string;
  timestamp: string;
}

interface Trend {
  id: string;
  title: string;
  summary: string;
  description?: string; // Optional expanded description
  category: string;
  headlines: Headline[];
}

interface DailyNewsletter {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  trends: Trend[];
}

interface NewsletterResponse {
  status?: "building";
  error?: string;
  id?: string;
  title?: string;
  subtitle?: string;
  date?: string;
  trends?: Trend[];
}

export function useNewsletter() {
  const [newsletter, setNewsletter] = useState<DailyNewsletter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [cacheKey, setCacheKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewsletter = async () => {
      try {
        setLoading(true);
        setError(null);
        setStatus(null);
        
        // Read user's selected categories from localStorage (same as Quick Browse)
        let catsQuery = '';
        try {
          const saved = typeof window !== 'undefined' ? localStorage.getItem('kanbanSelected') : null;
          if (saved) {
            const selected: unknown = JSON.parse(saved);
            if (Array.isArray(selected) && selected.length > 0) {
              const ids = selected.filter((id): id is string => typeof id === 'string');
              if (ids.length > 0) {
                catsQuery = `?cats=${encodeURIComponent(ids.join(','))}`;
              }
            }
          }
        } catch (e) {
          // Ignore localStorage errors and proceed without cats query
        }
        const response = await fetch(`/api/newsletter${catsQuery}`);
        if (!response.ok) {
          throw new Error('Failed to fetch newsletter');
        }
        
        const result: NewsletterResponse = await response.json();
        
        if (result.status === "building") {
          setStatus("building");
          setError(result.error || "Newsletter is being built");
        } else if (result && result.trends && Array.isArray(result.trends)) {
          setNewsletter(result as DailyNewsletter);
          setCacheKey(result.date || null);
        } else {
          throw new Error('Invalid newsletter data structure');
        }
      } catch (err) {
        console.error('Error fetching newsletter:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchNewsletter();
  }, []);

  return { newsletter, loading, error, status, cacheKey };
}
