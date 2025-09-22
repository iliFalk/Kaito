/**
 * SecureStorage - Handles encrypted storage of sensitive data like API keys
 * Uses Chrome Storage API with Web Crypto API for encryption
 */

interface EncryptedData {
  iv: string;
  salt: string;
  ciphertext: string;
}

export class SecureStorage {
  private static instance: SecureStorage;
  private readonly PBKDF2_ITERATIONS = 100000;
  
  private constructor() {}
  
  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }
  
  /**
   * Derives an encryption key from a password using PBKDF2
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  /**
   * Encrypts a string value using AES-GCM
   */
  async encrypt(value: string, password: string): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(password, salt);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(value)
    );
    
    return {
      iv: this.arrayBufferToBase64(iv),
      salt: this.arrayBufferToBase64(salt),
      ciphertext: this.arrayBufferToBase64(encrypted)
    };
  }
  
  /**
   * Decrypts an encrypted value using AES-GCM
   */
  async decrypt(encryptedData: EncryptedData, password: string): Promise<string> {
    const salt = this.base64ToArrayBuffer(encryptedData.salt);
    const iv = this.base64ToArrayBuffer(encryptedData.iv);
    const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext);
    const key = await this.deriveKey(password, new Uint8Array(salt));
    
    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        key,
        ciphertext
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error('Failed to decrypt data. Invalid password or corrupted data.');
    }
  }
  
  /**
   * Saves an API key securely to Chrome storage
   */
  async saveApiKey(provider: string, apiKey: string): Promise<void> {
    // Generate a unique password for this session
    // In production, this should be derived from user authentication
    const sessionPassword = await this.getSessionPassword();
    const encrypted = await this.encrypt(apiKey, sessionPassword);
    
    await chrome.storage.local.set({
      [`${provider}_api_key`]: encrypted
    });
  }
  
  /**
   * Retrieves and decrypts an API key from Chrome storage
   */
  async getApiKey(provider: string): Promise<string | null> {
    const result = await chrome.storage.local.get(`${provider}_api_key`);
    const encrypted = result[`${provider}_api_key`] as EncryptedData;
    
    if (!encrypted) {
      return null;
    }
    
    try {
      const sessionPassword = await this.getSessionPassword();
      return await this.decrypt(encrypted, sessionPassword);
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      return null;
    }
  }
  
  /**
   * Removes an API key from storage
   */
  async removeApiKey(provider: string): Promise<void> {
    await chrome.storage.local.remove(`${provider}_api_key`);
  }
  
  /**
   * Validates if an API key exists without decrypting it
   */
  async hasApiKey(provider: string): Promise<boolean> {
    const result = await chrome.storage.local.get(`${provider}_api_key`);
    return !!result[`${provider}_api_key`];
  }
  
  /**
   * Gets or generates a session password for encryption
   * In production, implement proper user authentication
   */
  private async getSessionPassword(): Promise<string> {
    // Check if we have a session password in memory
    const session = await chrome.storage.session.get('session_password');
    
    if (session.session_password) {
      return session.session_password;
    }
    
    // Generate a new session password
    const password = this.generateRandomPassword();
    await chrome.storage.session.set({ session_password: password });
    return password;
  }
  
  /**
   * Generates a cryptographically secure random password
   */
  private generateRandomPassword(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.arrayBufferToBase64(array);
  }
  
  /**
   * Converts an ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  
  /**
   * Converts a base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return buffer;
  }
}

// Export singleton instance
export const secureStorage = SecureStorage.getInstance();

// Usage example:
/*
import { secureStorage } from './secureStorage';

// Save API key
await secureStorage.saveApiKey('gemini', 'your-api-key-here');

// Retrieve API key
const apiKey = await secureStorage.getApiKey('gemini');

// Check if API key exists
const hasKey = await secureStorage.hasApiKey('gemini');

// Remove API key
await secureStorage.removeApiKey('gemini');
*/