export enum Sender {
  User = 'user',
  AI = 'ai',
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  isStreaming?: boolean;
  error?: string;
  quotedText?: string;
  filePreview?: string; // base64 data URL
  fileName?: string;
  pageContext?: { title: string; url: string };
}

export interface Shortcut {
  id: string;
  icon: string;
  title: string;
  prompt: string;
  isDefault?: boolean;
}

export interface SearchEngine {
  id: string;
  name: string;
  icon: React.ReactNode;
  url: string;
}

export interface AIModel {
  id: string;
  name: string;
  model: string;
  isDefault?: boolean;
  apiType?: string;
  apiKey?: string;
  apiBaseUrl?: string;
  supportImage?: boolean;
  contextWindow?: number;
  temperature?: number;
}
