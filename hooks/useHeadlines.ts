import { useState, useEffect } from 'react';

interface Headline {
  title: string;
  url: string;
  sources: string[];
  category: string;
  timestamp: string;
  sourceCount: number;
}

interface HeadlinesColumn {
  category: string;
  headlines: Headline[];
}

interface HeadlinesData {
  date: string;
  columns: HeadlinesColumn[];
}

interface HeadlinesResponse {
  success: boolean;
  data: HeadlinesData;
  timestamp: string;
  note?: string;
}

export function useHeadlines() {
  const [headlines, setHeadlines] = useState<HeadlinesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHeadlines() {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Headlines hook called");
        const response = await fetch('/api/headlines');
        
        if (!response.ok) {
          throw new Error('Failed to fetch headlines');
        }
        
        const result: HeadlinesResponse = await response.json();
        
        if (result && result.data && result.data.columns) {
          setHeadlines(result.data);
          console.log("Headlines data loaded successfully");
        } else {
          throw new Error('Invalid headlines data structure');
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Error fetching headlines:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchHeadlines();
  }, []);

  return { headlines, loading, error };
}
