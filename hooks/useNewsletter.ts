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

export function useNewsletter() {
  const [newsletter, setNewsletter] = useState<DailyNewsletter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewsletter = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/newsletter');
        if (!response.ok) {
          throw new Error('Failed to fetch newsletter');
        }
        
        const result = await response.json();
        if (result && result.trends && Array.isArray(result.trends)) {
          setNewsletter(result);
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

  return { newsletter, loading, error };
}
