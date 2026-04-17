import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { config } from '../constants/config';

// Create axios instance with default config
const defaultHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
};

if (config.apiKey) {
  defaultHeaders['X-API-Key'] = config.apiKey;
}

const api = axios.create({
  baseURL: config.baseUrl,
  headers: defaultHeaders,
  timeout: 30000, // 30 second timeout for AI processing
});

// Request interceptor for logging
api.interceptors.request.use(
  (requestConfig: InternalAxiosRequestConfig) => {
    const fullUrl = `${requestConfig.baseURL || ''}${requestConfig.url || ''}`;
    console.log(`[API] ${requestConfig.method?.toUpperCase()} ${fullUrl}`);
    return requestConfig;
  },
  (error: AxiosError) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const fullUrl = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
    console.error('[API] Response error:', {
      url: fullUrl,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      code: error.code,
    });
    return Promise.reject(error);
  }
);

const getServerErrorMessage = (data: unknown): string | null => {
  if (!data || typeof data !== 'object') return null;
  const maybeError = (data as { error?: unknown }).error;
  return typeof maybeError === 'string' ? maybeError : null;
};

export const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (!axios.isAxiosError(err)) {
    return err instanceof Error ? err.message : fallback;
  }

  const serverMessage = getServerErrorMessage(err.response?.data);
  if (serverMessage) return serverMessage;

  if (err.code === 'ECONNABORTED') {
    return `Request timed out. API URL: ${config.baseUrl}`;
  }

  if (err.message === 'Network Error') {
    return `Network error. Cannot reach backend at ${config.baseUrl}`;
  }

  return err.message || fallback;
};

export interface Meeting {
  id: string;
  title: string;
  clientName: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  createdAt: string;
  shareToken?: string;
}

export interface MeetingDetail {
  meeting: Meeting;
  output: {
    summary: string;
    action_items: string[];
    key_decisions: string[];
    open_questions: string[];
    next_steps: string[];
  } | null;
}

export interface CreateMeetingRequest {
  clientName: string;
  title: string;
}

export interface CreateMeetingResponse {
  meeting: Meeting;
}

export interface UploadTranscriptRequest {
  content: string;
}

export interface UploadTranscriptResponse {
  transcript: {
    id: string;
    meetingId: string;
    source: 'text' | 'audio';
    createdAt: string;
  };
}

export interface ProcessMeetingResponse {
  status: 'done' | 'processing' | 'error';
  output?: {
    summary: string;
    action_items: string[];
    key_decisions: string[];
    open_questions: string[];
    next_steps: string[];
  };
}

// API Methods
export const meetingApi = {
  /**
   * Create a new meeting
   */
  createMeeting: async (data: CreateMeetingRequest): Promise<CreateMeetingResponse> => {
    const response = await api.post('/meetings', data);
    return response.data;
  },

  /**
   * Upload transcript for a meeting
   */
  uploadTranscript: async (
    meetingId: string,
    data: UploadTranscriptRequest
  ): Promise<UploadTranscriptResponse> => {
    const response = await api.post(`/meetings/${meetingId}/transcript`, data);
    return response.data;
  },

  /**
   * Process meeting with AI
   */
  processMeeting: async (meetingId: string): Promise<ProcessMeetingResponse> => {
    const response = await api.post(`/meetings/${meetingId}/process`);
    return response.data;
  },

  /**
   * Get all meetings
   */
  getMeetings: async (): Promise<{ meetings: Meeting[] }> => {
    const response = await api.get('/meetings');
    return response.data;
  },

  /**
   * Get single meeting details with AI output
   */
  getMeetingDetail: async (meetingId: string): Promise<MeetingDetail> => {
    const response = await api.get(`/meetings/${meetingId}`);
    return response.data;
  },
};

export default api;
