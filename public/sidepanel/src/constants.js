
import React from 'react';
import { GoogleIcon, PerplexityIcon, PhindIcon } from './components/Icons.js';
import { ApiType } from './types.js';

export const PANEL_ROUTES = {
  SEARCH: '/search',
  CONVERSATION: '/',
  OPTIONS: '/options',
  MODELS: '/models',
  SETTINGS: '/settings',
};

export const SEARCH_ENGINES = [
  { id: 'google', name: 'Google', icon: React.createElement(GoogleIcon, { className: "w-6 h-6" }), url: 'https://www.google.com/search?q=' },
  { id: 'perplexity', name: 'Perplexity', icon: React.createElement(PerplexityIcon, { className: "w-6 h-6" }), url: 'https://www.perplexity.ai/search?q=' },
  { id: 'phind', name: 'Phind', icon: React.createElement(PhindIcon, { className: "w-6 h-6" }), url: 'https://www.phind.com/search?q=' },
];

export const DEFAULT_SHORTCUTS = [
  { id: 'summarize', icon: 'DocumentTextIcon', title: 'Summarize', prompt: 'Summarize the following text:\n\n{{selected_text}}', isDefault: true },
  { id: 'translate', icon: 'LanguageIcon', title: 'Translate to English', prompt: 'Translate the following text to English:\n\n{{selected_text}}', isDefault: true },
  { id: 'grammar', icon: 'CheckCircleIcon', title: 'Check Grammar', prompt: 'Check the grammar and spelling of the following text and provide corrections:\n\n{{selected_text}}', isDefault: true },
  { id: 'explain', icon: 'QuestionMarkCircleIcon', title: 'Explain This', prompt: 'Explain the following concept in simple terms:\n\n{{selected_text}}', isDefault: true },
];

export const DEFAULT_MODELS = [
  { 
    id: 'gemini-2.5-flash', 
    name: 'Gemini 2.5 Flash', 
    model: 'gemini-2.5-flash', 
    apiType: ApiType.Gemini,
    supportImage: true,
    isDefault: true 
  },
];
