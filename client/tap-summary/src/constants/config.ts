import Constants from 'expo-constants';
import { Platform } from 'react-native';

const normalizeApiBaseUrl = (value: string): string => {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const getExpoDevHost = (): string | null => {
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any).manifest?.debuggerHost;

  if (!hostUri) return null;
  return String(hostUri).split(':')[0] || null;
};

const resolveBaseUrl = (): string => {
  const envBaseUrl = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL || '');
  if (envBaseUrl) return envBaseUrl;

  const expoHost = getExpoDevHost();
  if (expoHost) {
    return `http://${expoHost}:3000/api`;
  }

  if (Platform.OS === 'android') {
    return 'http://192.168.1.138:3000/api';
  }

  return 'http://192.168.1.138:3000/api';
};

export const config = {
  baseUrl: resolveBaseUrl(),
  // Optional in hackathon mode when backend auth bypass is enabled
  apiKey: process.env.EXPO_PUBLIC_API_KEY || '',
};
