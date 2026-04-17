import { useState, useEffect, useCallback } from 'react';
import { getApiErrorMessage, meetingApi, Meeting } from '../services/api';

interface UseMeetingsResult {
  meetings: Meeting[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMeetings(): UseMeetingsResult {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await meetingApi.getMeetings();
      setMeetings(data.meetings);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to fetch meetings');
      setError(message);
      console.error('[useMeetings] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  return {
    meetings,
    loading,
    error,
    refresh: fetchMeetings,
  };
}
