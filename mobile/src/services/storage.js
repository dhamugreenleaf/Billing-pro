import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'gobill_auth_token';
const USER_KEY = 'gobill_auth_user';

// In-memory fallback if secure store is unavailable (e.g. web preview)
const memoryStore = new Map();

export const Storage = {
  /**
   * Save JWT token securely
   */
  async setToken(token) {
    if (!token) return;
    try {
      if (Platform.OS === 'web') {
        memoryStore.set(TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
      }
    } catch (error) {
      console.warn('[Storage] Failed to save token securely:', error.message);
      memoryStore.set(TOKEN_KEY, token);
    }
  },

  /**
   * Retrieve JWT token
   */
  async getToken() {
    try {
      if (Platform.OS === 'web') {
        return memoryStore.get(TOKEN_KEY) || null;
      }
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      return token || memoryStore.get(TOKEN_KEY) || null;
    } catch (error) {
      console.warn('[Storage] Failed to get token:', error.message);
      return memoryStore.get(TOKEN_KEY) || null;
    }
  },

  /**
   * Remove JWT token
   */
  async removeToken() {
    try {
      if (Platform.OS === 'web') {
        memoryStore.delete(TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (error) {
      console.warn('[Storage] Failed to delete token:', error.message);
    } finally {
      memoryStore.delete(TOKEN_KEY);
    }
  },

  /**
   * Save user session profile object
   */
  async setUser(user) {
    if (!user) return;
    try {
      const json = JSON.stringify(user);
      if (Platform.OS === 'web') {
        memoryStore.set(USER_KEY, json);
      } else {
        await SecureStore.setItemAsync(USER_KEY, json, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
      }
    } catch (error) {
      console.warn('[Storage] Failed to save user:', error.message);
      memoryStore.set(USER_KEY, JSON.stringify(user));
    }
  },

  /**
   * Retrieve user session profile
   */
  async getUser() {
    try {
      let json = null;
      if (Platform.OS === 'web') {
        json = memoryStore.get(USER_KEY);
      } else {
        json = await SecureStore.getItemAsync(USER_KEY);
        if (!json) json = memoryStore.get(USER_KEY);
      }
      return json ? JSON.parse(json) : null;
    } catch (error) {
      console.warn('[Storage] Failed to get user:', error.message);
      return null;
    }
  },

  /**
   * Clear all auth session data on logout
   */
  async clearSession() {
    await this.removeToken();
    try {
      if (Platform.OS === 'web') {
        memoryStore.delete(USER_KEY);
      } else {
        await SecureStore.deleteItemAsync(USER_KEY);
      }
    } catch (e) {
      // ignore
    } finally {
      memoryStore.delete(USER_KEY);
    }
  },
};

export default Storage;
