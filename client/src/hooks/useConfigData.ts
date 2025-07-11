import { useQuery } from '@tanstack/react-query';

const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
? 'http://localhost:3001'
: 'https://api.lottoblokk.com';

export function useConfigData() {
  // The config is cached by react-query
  return useQuery({
    queryKey: [`${API_URL}/config`],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/config`);
      if (!res.ok) throw new Error('Failed to fetch config');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
} 