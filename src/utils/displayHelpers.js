import { escapeHtml } from './validation/inputSanitizer.js';

export function safeText(text) {
  if (!text || typeof text !== 'string') return text;
  return escapeHtml(text);
}

export function safeNotes(notes) {
  return safeText(notes);
}

export function safeDescription(desc) {
  return safeText(desc);
}

export function safeAddress(address) {
  return safeText(address);
}

export function safeCompanyName(name) {
  return safeText(name);
}
