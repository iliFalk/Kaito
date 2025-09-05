import { useState, useEffect } from 'react';

export const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    // FIX: Cannot find name 'chrome'. Access via window to avoid TS errors.
    const chrome = (window as any).chrome;
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(key, (result: { [key: string]: any }) => {
            if (chrome.runtime.lastError) {
                console.error(`Error getting key "${key}" from chrome.storage:`, chrome.runtime.lastError);
                setStoredValue(initialValue);
            } else if (result[key] !== undefined) {
                setStoredValue(result[key]);
            } else {
                setStoredValue(initialValue);
                chrome.storage.local.set({ [key]: initialValue });
            }
        });

        // FIX: Cannot find namespace 'chrome'. Use a generic type for changes.
        const handleStorageChange = (changes: { [key: string]: any }, areaName: string) => {
            if (areaName === 'local' && changes[key]) {
                setStoredValue(changes[key].newValue);
            }
        };

        chrome.storage.onChanged.addListener(handleStorageChange);
        return () => {
            chrome.storage.onChanged.removeListener(handleStorageChange);
        };
    } else {
        // Fallback for non-extension environment
        try {
            const item = window.localStorage.getItem(key);
            const value = item ? JSON.parse(item) : initialValue;
            setStoredValue(value);
            if (!item) {
              window.localStorage.setItem(key, JSON.stringify(initialValue));
            }
        } catch (error) {
            console.error(error);
            setStoredValue(initialValue);
        }
    }
  }, [key, initialValue]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        // FIX: Cannot find name 'chrome'. Access via window to avoid TS errors.
        const chrome = (window as any).chrome;
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ [key]: valueToStore }, () => {
                if (chrome.runtime.lastError) {
                    console.error(`Error setting key "${key}" in chrome.storage:`, chrome.runtime.lastError);
                }
            });
        } else {
            // Fallback for non-extension environment
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
    } catch (error) {
        console.error(error);
    }
  };

  return [storedValue, setValue];
};
