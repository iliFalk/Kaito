import React from 'react';
import type { SearchEngine, Shortcut, AIModel } from './types';
import { GoogleIcon, PerplexityIcon, PhindIcon } from './components/Icons';

export const PANEL_ROUTES = {
  SEARCH: '/search',
  CONVERSATION: '/',
  OPTIONS: '/options',
  MODELS: '/models',
  SETTINGS: '/settings',
};

export const SEARCH_ENGINES: SearchEngine[] = [
  { id: 'google', name: 'Google', icon: <GoogleIcon className="w-6 h-6" />, url: 'https://www.google.com/search?q=' },
  { id: 'perplexity', name: 'Perplexity', icon: <PerplexityIcon className="w-6 h-6" />, url: 'https://www.perplexity.ai/search?q=' },
  { id: 'phind', name: 'Phind', icon: <PhindIcon className="w-6 h-6" />, url: 'https://www.phind.com/search?q=' },
];

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: 'summarize', icon: 'DocumentTextIcon', title: 'Summarize', prompt: 'Summarize the following text:\n\n{{selected_text}}', isDefault: true },
  { id: 'translate', icon: 'LanguageIcon', title: 'Translate to English', prompt: 'Translate the following text to English:\n\n{{selected_text}}', isDefault: true },
  { id: 'grammar', icon: 'CheckCircleIcon', title: 'Check Grammar', prompt: 'Check the grammar and spelling of the following text and provide corrections:\n\n{{selected_text}}', isDefault: true },
  { id: 'explain', icon: 'QuestionMarkCircleIcon', title: 'Explain This', prompt: 'Explain the following concept in simple terms:\n\n{{selected_text}}', isDefault: true },
];

export const DEFAULT_MODELS: AIModel[] = [
  { id: 'gemini-2.5-flash', name: 'gemini-2.5-flash', model: 'gemini-2.5-flash', isDefault: true },
];
