import Constants from 'expo-constants';
import { Platform } from 'react-native';

const PROD_API_URL = 'https://gobill.gldatacenter.com/api';

const isDev = __DEV__;

// Helper to determine optimal dev URL based on platform
const resolveApiUrl = () => {
  // 1. Explicit env var override
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // 2. Extra app config override
  if (Constants.expoConfig?.extra?.apiUrl) {
    return Constants.expoConfig.extra.apiUrl;
  }
  // 3. Physical device running Expo Go - check if debugger host is local IP or use production
  const hostUri = Constants.expoConfig?.hostUri;
  if (isDev && hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      // Connect to local dev machine if desired, or fallback safely to live API
      return `http://${hostIp}:5000/api`;
    }
  }
  // Default to reliable live production HTTPS API
  return PROD_API_URL;
};

export const ENV = {
  isDev,
  API_BASE_URL: resolveApiUrl(),
  PRODUCTION_API_URL: PROD_API_URL,
  TIMEOUT_MS: 15000,
  APP_NAME: 'GoBill',
  APP_VERSION: '1.0.0',
};

export default ENV;
