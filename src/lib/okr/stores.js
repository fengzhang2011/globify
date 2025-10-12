import { writable } from 'svelte/store';

// Shared stores for communication between OKR components
export const selectedOKR = writable(null);
export const selectedDate = writable(new Date());
export const currentView = writable('current'); // 'current', 'historical', 'predicted'
export const okrDataStore = writable([]); // Store for OKR data to access hierarchy
