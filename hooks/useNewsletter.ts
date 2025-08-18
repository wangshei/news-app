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
        
        const response = await fetch('/api/newsletter');
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
