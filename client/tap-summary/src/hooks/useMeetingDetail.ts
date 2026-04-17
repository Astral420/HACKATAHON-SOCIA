import { useState, useEffect, useCallback } from 'react';
import { getApiErrorMessage, meetingApi, MeetingDetail } from '../services/api';

interface UseMeetingDetailResult {
  meetingDetail: MeetingDetail | null;
  loading: boolean;
  error: string | null;
  refresh: (meetingId: string) => Promise<void>;
}

export function useMeetingDetail(): UseMeetingDetailResult {
  const [meetingDetail, setMeetingDetail] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetingDetail = useCallback(async (meetingId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await meetingApi.getMeetingDetail(meetingId);
      setMeetingDetail(data);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to fetch meeting details');
      setError(message);
      console.error('[useMeetingDetail] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      setMeetingDetail(null);
      setError(null);
    };
  }, []);

  return {
    meetingDetail,
    loading,
    error,
    refresh: fetchMeetingDetail,
  };
}
